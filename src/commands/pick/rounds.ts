import R from 'ramda';
import rank from './ranks';

export default function getRounds(
  ids: string[],
  rounds: string[],
  count: number,
): {
  summaries: string[];
  picks: string[];
} {
  if (ids.length === count) {
    rounds.push(`Pick/s: ${ids.map((id) => `<@${id}>`).join(', ')}\n`);

    return {
      summaries: rounds,
      picks: ids,
    };
  }

  const ranks = rank(ids);
  const randomScores = R.map(([a, b]) => `<@${a}> = ${b}`, ranks);
  rounds.push(`Round ${rounds.length + 1}:\n${randomScores.join('\n')}`);
  const [, threshold] = ranks[count - 1];
  const thoseWhoMadeIt = R.filter(([, stones]) => stones >= threshold, ranks);

  return getRounds(
    R.map(([a]) => a, thoseWhoMadeIt),
    rounds,
    count,
  );
}
