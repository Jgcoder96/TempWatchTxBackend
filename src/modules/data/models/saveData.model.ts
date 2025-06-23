import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { err } from '../errors';
import { SensorDataParsed } from '../types';

export const saveData = async (data: SensorDataParsed[]): Promise<void> => {
  const prisma = new PrismaClient();
  try {
    const results = [];
    for (const item of data) {
      const newSample = await prisma.sensor_samples.create({
        data: {
          ...item.sampleData,
          ...(item.eventData && {
            events: { create: item.eventData },
          }),
        },
      });
      results.push(newSample);
    }
  } catch (error) {
    if (!(error instanceof PrismaClientKnownRequestError)) throw error;
    if (error.code === 'P2003') throw new err.RecordDoesNotExists();
    if (error.code === 'P2002') throw new err.RecordAlreadyExists();
    throw error;
  }
};
