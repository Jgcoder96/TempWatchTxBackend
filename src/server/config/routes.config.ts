import type { Router } from 'express';

import { dataRoutes } from '../../modules/data/routes';

interface ServerRoutes {
  data: Router;
}

const serverRoutes: ServerRoutes = {
  data: dataRoutes(),
};

export { serverRoutes, ServerRoutes };
