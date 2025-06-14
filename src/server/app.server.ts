import express from 'express';
import type { Express } from 'express';
import { setConfig } from './helpers';
import { serverRoutes } from './config';

export const server = () => {
  const app: Express = express();
  setConfig({ app, routes: serverRoutes });
  return app;
};
