import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'tempWatch',
      version: '1.0.0',
      description: '',
      contact: {
        name: 'jgcoder96',
      },
    },
  },
  apis: [`${path.join(__dirname, './**/*.yml')}`],
};

export const swaggerJSDocOption = swaggerJSDoc(options);
