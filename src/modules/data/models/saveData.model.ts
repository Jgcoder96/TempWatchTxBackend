import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { err } from '../errors';
import type { SensorData } from '../types';

export const saveData = async (data: SensorData[]): Promise<void> => {
  const prisma = new PrismaClient();
  try {
    await prisma.sensor_samples.createMany({
      data,
    });
  } catch (error) {
    if (!(error instanceof PrismaClientKnownRequestError)) throw error;
    if (error.code === 'P2003') throw new err.RecordDoesNotExists();
    if (error.code === 'P2002') throw new err.RecordAlreadyExists();
    throw error;
  }
};
