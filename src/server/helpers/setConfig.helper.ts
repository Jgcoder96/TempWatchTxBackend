import express from 'express';
import type { Express, Request, Response } from 'express';
import { ServerRoutes } from '../config';
import { setRoutes } from './index';

interface Options {
  app: Express;
  routes: ServerRoutes;
}

export const setConfig = ({ app, routes }: Options): Express => {
  app.use(express.json());
  setRoutes({ app, routes });
  app.get(/^\/(?!api).*/, (req: Request, res: Response) => {
    res.json({ procced: false, message: 'routes not found' });
  });
  return app;
};
