import express from 'express';
import morgan from 'morgan';
import type { Express, Request, Response } from 'express';
import { ServerRoutes } from '../config';
import { setRoutes } from './index';

interface Options {
  app: Express;
  routes: ServerRoutes;
}

export const setConfig = ({ app, routes }: Options): Express => {
  app.use(express.json());
  app.use(morgan('dev'));
  setRoutes({ app, routes });
  app.get(/^\/(?!api).*/, (req: Request, res: Response) => {
    res.json({ res: false, message: 'ruta no encontrada' });
  });
  return app;
};
