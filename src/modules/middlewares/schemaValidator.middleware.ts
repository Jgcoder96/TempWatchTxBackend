import { AnyZodObject, ZodError, ZodArray } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const schemaValidator =
  (schema: AnyZodObject | ZodArray<AnyZodObject>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          res: false,
          message: 'Parámetros incorrectos en el cuerpo de la solicitud.',
        });
      } else {
        res.status(500).json({
          res: false,
          message: 'Error interno del servidor',
        });
      }
    }
  };
