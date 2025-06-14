import { Router } from 'express';
import type { Express } from 'express';
import type { ServerRoutes } from '../config';

interface Options {
  app: Express;
  routes: ServerRoutes;
}

export const setRoutes = ({ app, routes }: Options): Router => {
  const router = Router();
  router.use('/data', routes.data);
  app.use('/api', router);
  return router;
};
