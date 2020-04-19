import crypto from 'crypto';
import * as d3 from 'd3-random';
import seed from 'seedrandom';

export default function getRandomNumberGenerator() {
  return d3.randomNormal.source(
    seed(crypto.randomBytes(10).toString('hex'), { entropy: true }),
  )(0, 1);
}
