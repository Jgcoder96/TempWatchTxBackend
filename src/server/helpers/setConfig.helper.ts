import express from 'express';
import morgan from 'morgan';
import type { Express, Request, Response } from 'express';
import { ServerRoutes } from '../config';
import { setRoutes } from './index';
import { botTelegraf } from '../../modules/telegram/server';
import { envs } from '../../config';

interface Options {
  app: Express;
  routes: ServerRoutes;
}

export const setConfig = ({ app, routes }: Options): Express => {
  app.use(express.json());
  app.use(morgan('dev'));

  setRoutes({ app, routes });

  const bot = botTelegraf();

  const secretPath = `/telegraf/${bot.secretPathComponent()}`;

  bot.telegram.setWebhook(`${envs.URL}${secretPath}`);

  app.use(bot.webhookCallback(secretPath));
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      res: false,
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
  });

  return app;
};
