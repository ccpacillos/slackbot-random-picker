import R from 'ramda';
import rp from 'request-promise';
import { Promise } from 'bluebird';

const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET } = process.env;

const origin = 'https://slack.com/api';
const APPLICATIONJSON = 'application/json';

async function request(params: {
  method?: string;
  path?: string;
  url?: string;
  body?: any;
  qs?: any;
  headers?: any;
  formData?: any;
  token?: string;
}) {
  let response: any;

  try {
    response = await rp({
      method: params.method || 'GET',
      uri: params.url || `${origin}/${params.path}`,
      formData: params.formData,
      body: params.body,
      json: true,
      qs: params.qs || {},
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${params.token}`,
        ...(params.headers || {}),
      },
    });
  } catch (error) {
    return {
      ok: false,
    };
  }

  return response;
}

export async function slackOAuthAccess(code: string): Promise<any> {
  const encoded = Buffer.from(
    `${SLACK_CLIENT_ID}:${SLACK_CLIENT_SECRET}`,
  ).toString('base64');

  return request({
    method: 'POST',
    path: 'oauth.v2.access',
    formData: { code },
    headers: {
      Authorization: `Basic ${encoded}`,
    },
  });
}

export async function slackChatPostMessage(
  token: string,
  message: any,
): Promise<any> {
  return request({
    method: 'POST',
    path: 'chat.postMessage',
    body: {
      ...message,
      blocks: JSON.stringify(message.blocks),
    },
    token,
    headers: {
      'Content-Type': APPLICATIONJSON,
    },
  });
}

export async function slackChatPostEphemeral(
  token: string,
  message: any,
): Promise<any> {
  return request({
    method: 'POST',
    path: 'chat.postEphemeral',
    qs: {
      ...message,
      blocks: JSON.stringify(message.blocks),
    },
    token,
  });
}

export async function slackConversationMembers(
  token: string,
  channel: string,
): Promise<any[]> {
  const getMembers = async (cursor?: string): Promise<string[]> => {
    const res = await request({
      token,
      method: 'GET',
      path: 'conversations.members',
      qs: {
        cursor,
        channel,
      },
    });

    const { next_cursor: nextCursor } = res.response_metadata;

    if (nextCursor === '') {
      return [...res.members];
    }

    return [...(await getMembers(nextCursor)), ...res.members];
  };

  const slackUsersInfo = async (
    token: string,
    slackUserId: string,
  ): Promise<any> => {
    return request({
      path: 'users.info',
      qs: {
        user: slackUserId,
      },
      token,
    });
  };

  const memberIds = await getMembers();

  const users = await Promise.map(
    memberIds,
    async (memberId) => {
      const res = await slackUsersInfo(token, memberId);
      return res.user;
    },
    { concurrency: 5 },
  );

  return R.filter(
    (user: any) =>
      !user.deleted &&
      !user.is_restricted &&
      !user.is_ultra_restricted &&
      !user.is_bot,
    users,
  );
}
