import type { Request, Response } from 'express';
import { services } from '../services';
interface ServerResponse {
  res: boolean;
  statusCode: number;
  message: string;
}

export const saveData = async (req: Request, res: Response) => {
  try {
    const { statusCode, ...rest } = await services.saveData(req.body.data);
    res.status(statusCode).json(rest);
  } catch (error) {
    const { statusCode, ...rest }: ServerResponse = {
      res: false,
      statusCode: 500,
      message: 'error interno del servidor',
    };
    res.status(statusCode).json(rest);
    console.log(error);
  }
};
