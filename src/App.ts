import Koa from 'koa';
import body from 'koa-body';
import cors from '@koa/cors';
import Application from 'koa';
import compose from 'koa-compose';
import { Logger } from 'highoutput-utilities';
import { db } from './lib/sqlite';

const logger = new Logger(['app']);

export default class App {
  koa: Koa;

  constructor(opts: { middlewares: Application.Middleware<any, any>[] }) {
    const koa = new Koa();
    koa.use(cors());
    koa.use(body({ multipart: true, includeUnparsed: true }));
    koa.use(compose(opts.middlewares));
    this.koa = koa;
  }

  async start(): Promise<void> {
    this.watchExitSignals();
    try {
      this.koa.listen(
        {
          port: process.env.PORT || 8000,
        },
        () => {
          logger.info('Server ready.');
        },
      );
    } catch (error) {
      logger.error(error);
    }
  }

  async stop(signal?: string): Promise<void> {
    logger.info(`Stop: ${signal}`);
    db.close();
    process.exit();
  }

  private watchExitSignals() {
    process.once('SIGTERM', () => this.stop('SIGTERM'));
    process.once('SIGINT', () => this.stop('SIGINT'));
    process.once('SIGHUP', () => this.stop('SIGHUP'));

    process.on('uncaughtException', (err) => {
      logger.error(err);
      process.exit(-1);
    });
  }
}
