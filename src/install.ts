import { slackOAuthAccess } from './lib/request';
import { dbRun } from './lib/sqlite';

export async function install(ctx: any) {
  const { code } = ctx.query;
  const res = await slackOAuthAccess(code);

  if (res.error) {
    ctx.body({
      ok: false,
      message: 'Too bad!',
    });
  }

  await dbRun(
    `
    INSERT INTO Team (
      externalId,
      botId,
      token
    ) VALUES (
      ?, ?, ?
    )
  `,
    [res.team.id, res.bot_user_id, res.access_token],
  );

  ctx.status = 200;
  ctx.body = { ok: true };
}
