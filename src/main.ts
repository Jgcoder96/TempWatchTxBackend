import { server } from './server';

const main = () => {
  const app = server();
  const port = 3000;
  const httpServer = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  httpServer.timeout = 300000;
};

(async () => {
  main();
})();
