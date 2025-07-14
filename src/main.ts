import { envs } from './config';
import { server } from './server';

const main = () => {
  const app = server();
  const port = envs.PORT || 8080;
  const httpServer = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  httpServer.timeout = 300000;
};

(async () => {
  main();
})();
