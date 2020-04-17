import sqlite from 'sqlite3';
import Promise from 'bluebird';

export const db = new sqlite.Database('db.sqlite');

export async function dbRun(sql: string, params?: (string | number)[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err: any, res: any) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
}

export async function dbGet(sql: string, params?: (string | number)[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: any, res: any) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
}

export async function dbAll(sql: string, params?: (string | number)[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: any, res: any) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
}
