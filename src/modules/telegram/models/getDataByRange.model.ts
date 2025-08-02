import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

interface DateInput {
  day: number;
  month: number;
  year: number;
}

interface DateRangeInput {
  startDate: DateInput;
  endDate: DateInput;
}

export const getDataByRange = async (
  dateRange: DateRangeInput,
  id_sensor: string,
) => {
  try {
    const prisma = new PrismaClient();

    const { startDate, endDate } = dateRange;

    const rangeStart = new Date(
      startDate.year,
      startDate.month - 1,
      startDate.day,
      0,
      0,
      0,
    );

    const rangeEnd = new Date(
      endDate.year,
      endDate.month - 1,
      endDate.day,
      23,
      59,
      59,
      999,
    );

    const records = await prisma.sensor_samples.findMany({
      where: {
        date: {
          gte: rangeStart,
          lte: rangeEnd,
        },
        id_sensor: id_sensor,
      },
      select: {
        date: true,
        temperature: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return records;
  } catch (error) {
    if (!(error instanceof PrismaClientKnownRequestError)) throw error;
    throw error;
  }
};
