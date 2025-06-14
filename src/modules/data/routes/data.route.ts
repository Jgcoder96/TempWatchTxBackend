import { Router } from 'express';
import { dataControllers } from '../controllers';

export const dataRoutes = () => {
  const router = Router();
  router.post('/data', dataControllers.saveData);
  return router;
};
