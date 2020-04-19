import R from 'ramda';
import { db } from '@src/lib/pg';

export default async function updateTallies(
  winners: string[],
  channelId: string,
) {
  await db.query(
    `UPDATE Tally SET times = 1 WHERE channelId = $1
      AND userId IN(${R.times((i) => `$${i + 2}`, winners.length).join(',')})`,
    [channelId, ...winners],
  );
}
