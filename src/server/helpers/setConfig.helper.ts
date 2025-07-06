import express from 'express';
import morgan from 'morgan';
import type { Express, Request, Response } from 'express';
import { ServerRoutes } from '../config';
import { setRoutes } from './index';
import { botTelegraf } from '../../modules/telegram/server';

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
  const bot = botTelegraf();

  const secretPath = `/telegraf/${bot.secretPathComponent()}`;
  bot.telegram.setWebhook(`https://temp-watch.loca.lt${secretPath}`);
  app.use(bot.webhookCallback(secretPath));
  app.get('/', (req, res) => {
    res.send('¡Hola! Soy un bot de Telegram corriendo en Express.');
  });
  console.log(`Ruta del Webhook (para configurar ngrok): ${secretPath}`);
  return app;
};
