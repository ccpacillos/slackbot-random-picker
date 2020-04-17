import crypto from 'crypto';

export async function authorize(ctx: any, next: any): Promise<void | never> {
  const timestamp = new Date().getTime() / 1000;
  const signature: string = ctx.request.header['x-slack-signature'];

  if (!signature) {
    return;
  }

  const requestTimestamp: number = +ctx.request.header[
    'x-slack-request-timestamp'
  ];

  if (timestamp - requestTimestamp > 60 * 5) {
    throw new Error('Replay attack detected.');
  }

  const [version] = signature.split('=');

  const unparsed = Symbol.for('unparsedBody');
  const basestring = [
    version,
    requestTimestamp,
    ctx.request.body[unparsed],
  ].join(':');
  const hash = crypto
    .createHmac('sha256', process.env.SLACK_SIGNING_SECRET as string)
    .update(basestring)
    .digest('hex');

  const signed = [version, hash].join('=');

  if (!crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(signature))) {
    return;
  }

  await next(ctx);
}
