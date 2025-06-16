import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

import { swaggerJSDocOption } from '../../docs';
import type { ServerRoutes } from '../config';

interface Options {
  app: Express;
  routes: ServerRoutes;
}

export const setRoutes = ({ app, routes }: Options): Router => {
  const router = Router();
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDocOption));
  router.use('/data', routes.data);
  app.use('/api', router);
  return router;
};
