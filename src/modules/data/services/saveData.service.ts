import { models } from '../models';
import { err } from '../errors';
import type { SensorData, ServerResponse } from '../types';
import { generateMessageForTelegram } from '../utils';
import { botTelegraf } from '../../telegram/server';

export const saveData = async (data: SensorData[]): Promise<ServerResponse> => {
  const ADMIN_CHAT_ID = '5949001499';
  try {
    const messages = generateMessageForTelegram(data);
    if (ADMIN_CHAT_ID && messages.length > 0) {
      botTelegraf()
        .telegram.sendMessage(ADMIN_CHAT_ID, messages[0], {
          parse_mode: 'Markdown',
        })
        .catch((error) => {
          console.error('Error al enviar notificación de Telegram:', error);
        });
    }
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
