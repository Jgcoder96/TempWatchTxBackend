import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const getSensorList = async () => {
  try {
    const prisma = new PrismaClient();

    const sensorList = await prisma.sensors.findMany({
      select: {
        id_sensor: true,
        name: true,
      },
    });

    return sensorList;
  } catch (error) {
    if (!(error instanceof PrismaClientKnownRequestError)) throw error;
    throw error;
  }
};
