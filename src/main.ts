import { envs } from './config';
import { server } from './server';

const main = () => {
  const app = server();
  const port = envs.PORT || 8080;
  const host = envs.HOST || 'localhost';
  const httpServer = app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
  });
  httpServer.timeout = 300000;
};

(async () => {
  main();
})();
