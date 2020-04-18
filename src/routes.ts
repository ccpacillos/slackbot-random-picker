import compose from 'koa-compose';
import Router from 'koa-router';
import { Logger } from 'highoutput-utilities';
import { authorize } from './lib/authorize';
import { commandHandler } from './commands';
import { install } from './install';

const logger = new Logger(['routes']);

const router = new Router();

router.post('/pick', authorize, commandHandler);
router.get('/install', install);
router.get('/install-it', async (ctx) => {
  const origin = 'https://slack.com/oauth/v2/authorize';
  const clientId = process.env.SLACK_CLIENT_ID;
  const scope = process.env.SLACK_AUTH_SCOPES;

  const url = `${origin}?client_id=${clientId}&scope=${scope}`;
  ctx.redirect(url);
});

export const appRoutes = compose([
  async (ctx: any, next: any) => {
    try {
      await next(ctx);
    } catch (error) {
      // Override error status codes to avoid error messages on Slack interface.
      // The more errors users will see, the more they think the app is bogus.
      // For as much as we know, this is a random picker, and in whatever aspect
      // of the app goes wrong no matter how simple, they'll think the shit is broken.
      // Or just pretending to be a real function.
      // So --- no error codes, please.
      ctx.status = 200;
      logger.error(error);
    }
  },
  router.routes(),
  router.allowedMethods(),
]);
