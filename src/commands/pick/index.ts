import R from 'ramda';
import { trim } from '@src/lib/trim';
import {
  slackChatPostMessage,
  slackConversationMembers,
} from '../../lib/request';
import { db } from '../../lib/pg';
import syncAndGetParticipants from './participants';
import updateTallies from './update_tallies';
import getRounds from './rounds';

export async function commandHandler(ctx: any) {
  const { body } = ctx.request;
  ctx.status = 200;

  const {
    rows: [team],
  }: any = await db.query('SELECT * FROM Team WHERE externalId = $1', [
    body.team_id,
  ]);

  if (!team) return;

  if (body.command !== '/pick' && body.command !== '/pick-test') return;

  const count = Number(body.text);

  if (count === NaN || count < 1) {
    ctx.body = 'Please provide a valid number!';
    return;
  }

  slackChatPostMessage(team.token, {
    channel: body.channel_id,
    as_user: true,
    text: trim('<!here> Random pick! Whose turn is it?'),
  }).then(async (res) => {
    const users = await slackConversationMembers(team.token, body.channel_id);
    const participants = await syncAndGetParticipants(users, body.channel_id);

    const replies = [];
    let picks = [];
    if (count >= participants.length) {
      replies.push(
        trim(`
          Pick count matches pool count.
          Automatically picking ${participants
            .map((id) => `<@${id}>`)
            .join(', ')}.
          All channel users added back to the pool for the next pick.
        `),
      );

      picks = participants;
      await db.query('UPDATE Tally SET times = 0 WHERE channelId = $1', [
        body.channel_id,
      ]);
    } else {
      const { summaries, picks: picksFromRounds } = getRounds(
        participants,
        [],
        count,
      );

      replies.push(
        R.last(summaries) as string,
        `Number of user/s in pool: ${participants.length}`,
        trim(`
          Random scores by round:
          ${R.init(summaries).join('\n')}
        `),
      );

      picks = picksFromRounds;
      await updateTallies(picks, body.channel_id);
    }

    slackChatPostMessage(team.token, {
      channel: body.channel_id,
      as_user: true,
      text: replies.join('\n'),
      thread_ts: res.message.ts,
    });
  });

  ctx.body = null;
}
