import { models } from '../models';
import type { SensorData } from '../types';
import { err } from '../errors';

interface ServerResponse {
  res: boolean;
  statusCode: number;
  message: string;
}

export const saveData = async (data: SensorData[]): Promise<ServerResponse> => {
  try {
    await models.saveData(data);
    const response: ServerResponse = {
      res: true,
      statusCode: 201,
      message: 'Los datos se registraron correctamente',
    };
    return response;
  } catch (error) {
    if (
      error instanceof err.RecordDoesNotExists ||
      error instanceof err.RecordDoesNotExists
    ) {
      const response: ServerResponse = {
        res: error.res,
        statusCode: error.statusCode,
        message: error.message,
      };
      return response;
    }
    throw error;
  }
};
