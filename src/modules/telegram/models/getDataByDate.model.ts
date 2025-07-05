import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

interface DateInput {
  day: number;
  month: number;
  year: number;
}

export const getDataByDate = async (date: DateInput, id_sensor: string) => {
  try {
    const prisma = new PrismaClient();

    const { day, month, year } = date;

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const records = await prisma.sensor_samples.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        id_sensor: id_sensor,
      },
      select: {
        date: true,
        temperature: true,
      },
    });

    return records;
  } catch (error) {
    if (!(error instanceof PrismaClientKnownRequestError)) throw error;
    throw error;
  }
};
