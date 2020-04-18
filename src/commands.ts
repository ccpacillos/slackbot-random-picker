import crypto from 'crypto';
import * as d3 from 'd3-random';
import seed from 'seedrandom';
import R from 'ramda';
import { dbGet } from './lib/sqlite';
import { slackConversationMembers, slackChatPostMessage } from './lib/request';

export async function commandHandler(ctx: any) {
  const { body } = ctx.request;
  ctx.status = 200;

  const team: any = await dbGet('SELECT * FROM Team WHERE externalId = ?', [
    body.team_id,
  ]);

  if (!team) return;

  if (body.command !== '/pick') return;
  if (!body.text) return;

  const count = Number(body.text);

  if (typeof count !== 'number') {
    ctx.body = 'Please provide a number!';
    return;
  }

  if (count < 1) {
    ctx.body = 'Please, dude.';
    return;
  }

  const users = await slackConversationMembers(team.token, body.channel_id);

  if (count > users.length) {
    ctx.body = 'Man, your input exceeds the number of users in the channel.';
    return;
  }

  const random = d3.randomNormal.source(
    seed(crypto.randomBytes(10).toString('hex'), { entropy: true }),
  )(0, 1);

  const runLeg = (participants: string[], rounds: string[]): string[] => {
    if (participants.length === count) {
      rounds.push(
        `Winners: ${R.map((id) => `<@${id}>`, participants).join(', ')}`,
      );

      return rounds;
    }

    const stones = R.times(() => random(), participants.length);
    const zip = R.zip(participants, stones);

    const sorted = R.sort(([, stonesA], [, stonesB]) => stonesB - stonesA, zip);
    const tallies = R.map(([a, b]) => `<@${a}> = ${b}`, sorted);
    rounds.push(
      `Round ${rounds.length + 1} Random Scores:\n${tallies.join('\n')}`,
    );
    const [, threshold] = sorted[count - 1];
    const thoseWhoMadeIt = R.filter(
      ([, stones]) => stones >= threshold,
      sorted,
    );

    return runLeg(
      R.map(([a]) => a, thoseWhoMadeIt),
      rounds,
    );
  };

  const rounds = runLeg(
    R.map(({ id }) => id, users),
    [],
  );

  slackChatPostMessage(team.token, {
    channel: body.channel_id,
    as_user: true,
    text: rounds.join('\n\n'),
  });

  ctx.body = null;
}
