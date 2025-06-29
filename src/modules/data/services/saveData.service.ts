import { models } from '../models';
import { err } from '../errors';
import type { SensorData, ServerResponse } from '../types';

export const saveData = async (data: SensorData[]): Promise<ServerResponse> => {
  try {
    const sensorDataParsed = data.map((item) => {
      const eventData =
        item.status && item.motor_speed
          ? {
              event: item.status,
              motor_speed: item.motor_speed,
            }
          : null;

      return {
        sampleData: {
          voltage: item.voltage,
          temperature: item.temperature,
          id_sensor: item.id_sensor,
        },
        eventData,
      };
    });

    await models.saveData(sensorDataParsed);

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
