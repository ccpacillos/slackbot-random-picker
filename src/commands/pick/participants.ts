import R from 'ramda';
import { db } from '@src/lib/pg';

export default async function syncAndGetParticipants(
  fetchedChannelUsers: any[],
  channelId: string,
) {
  const res = await db.query('SELECT * FROM Tally WHERE channelId = $1', [
    channelId,
  ]);

  const fetchedUserIds = fetchedChannelUsers.map(({ id }) => id);
  const userIdsFromDB = res.rows.map(({ userid }) => userid);

  const kicked = R.difference(userIdsFromDB, fetchedUserIds);
  if (kicked.length) {
    await db.query(
      `DELETE FROM Tally WHERE channelId = $1
        AND userId IN (
          ${R.times((i) => `$${i + 2}`, kicked.length).join(',')}
        )`,
      [channelId, ...kicked],
    );
  }

  const added = R.difference(fetchedUserIds, userIdsFromDB);
  if (added.length) {
    await db.query(
      `
        INSERT INTO Tally (userId, channelId) VALUES
        ${added.map((id) => `('${id}', '${channelId}')`).join(',')}
      `,
    );
  }

  const unPicked = R.filter(
    ({ times, userid }) => times === 0 && !R.includes(userid, kicked),
    res.rows,
  ).map(({ userid }) => userid);

  if (!added.length && !unPicked.length) {
    await db.query('UPDATE Tally SET times = 0 WHERE channelId = $1', [
      channelId,
    ]);

    return R.filter((id) => !R.includes(id, kicked), userIdsFromDB);
  }

  return [...added, ...unPicked];
}
