import R from 'ramda';
import getRandomNumberGenerator from '@src/lib/random';

export default function rank(ids: string[]): [string, number][] {
  const randomize = getRandomNumberGenerator();

  return R.pipe(
    R.times(() => randomize()),
    R.zip(ids),
    R.sort(([, stonesA], [, stonesB]) => stonesB - stonesA),
  )(ids.length);
}
