import * as path from 'path';
import serve from 'koa-static';
import App from './App';
import { appRoutes } from './routes';
import { db } from './lib/sqlite';

const publicPath = path.join(__dirname, '../public/');
async function start() {
  db.run(`
    CREATE TABLE IF NOT EXISTS Team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      externalId TEXT,
      botId TEXT,
      token TEXT
    )`);
  const app = new App({ middlewares: [serve(publicPath), appRoutes] });
  app.start();
}

start();
