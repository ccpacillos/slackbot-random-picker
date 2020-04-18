import { slackOAuthAccess } from './lib/request';
import { db } from './lib/pg';

export async function install(ctx: any) {
  const { code } = ctx.query;
  const res = await slackOAuthAccess(code);

  if (res.error) {
    ctx.body({
      ok: false,
      message: 'Too bad!',
    });
  }

  const {
    rows: [existing],
  } = await db.query('SELECT * FROM Team WHERE externalId = $1', [res.team.id]);

  if (existing) {
    await db.query('UPDATE Team SET token = $1 WHERE externalId = $2', [
      res.team.id,
      res.access_token,
    ]);
  } else {
    await db.query(
      `
      INSERT INTO Team (
        externalId,
        botId,
        token
      ) VALUES ($1, $2, $3)
    `,
      [res.team.id, res.bot_user_id, res.access_token],
    );
  }

  ctx.status = 200;
  ctx.body = { ok: true };
}
