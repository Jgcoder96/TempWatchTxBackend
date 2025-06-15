import { Router } from 'express';
import { schemaValidator } from '../../middlewares';
import { dataControllers } from '../controllers';
import { schemas } from '../schemas';

export const dataRoutes = () => {
  const router = Router();
  router.post(
    '/',
    [schemaValidator(schemas.saveData)],
    dataControllers.saveData,
  );
  return router;
};
