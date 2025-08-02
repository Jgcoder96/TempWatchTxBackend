import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DateInput {
  day: number;
  month: number;
  year: number;
}

interface DateRangeFilter {
  startDate: DateInput;
  endDate: DateInput;
}

export async function getEventsByRange(
  { startDate, endDate }: DateRangeFilter,
  sensorId: string,
) {
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

  try {
    const samples = await prisma.sensor_samples.findMany({
      where: {
        id_sensor: sensorId,
        date: {
          gte: rangeStart,
          lte: rangeEnd,
        },
        OR: [{ events: { some: {} } }, { motor_events: { some: {} } }],
      },
      include: {
        events: true,
        motor_events: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return samples.map((sample) => ({
      ...sample,
      date: sample.date.toISOString(),
      events: sample.events.map((event) => ({
        ...event,
        date: sample.date.toISOString(),
      })),
      motor_events: sample.motor_events.map((motorEvent) => ({
        ...motorEvent,
        date: sample.date.toISOString(),
      })),
    }));
  } catch (error) {
    console.error('Error fetching sensor data with events:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
