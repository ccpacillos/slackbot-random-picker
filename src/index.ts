import * as path from 'path';
import serve from 'koa-static';
import App from './App';
import { appRoutes } from './routes';

const publicPath = path.join(__dirname, '../public/');
async function start() {
  const app = new App({ middlewares: [serve(publicPath), appRoutes] });
  app.start();
}

start();
