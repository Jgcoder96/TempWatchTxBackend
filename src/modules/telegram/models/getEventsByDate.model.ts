import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DateFilter {
  day: number;
  month: number;
  year: number;
}

export async function getEventsByDate(
  sensorId: string,
  { day, month, year }: DateFilter,
) {
  const startDate = new Date(year, month - 1, day, 0, 0, 0);
  const endDate = new Date(year, month - 1, day, 23, 59, 59);

  try {
    const samples = await prisma.sensor_samples.findMany({
      where: {
        id_sensor: sensorId,
        date: {
          gte: startDate,
          lte: endDate,
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

    const filteredSamples = samples.filter(
      (sample) => sample.events.length > 0 || sample.motor_events.length > 0,
    );

    return filteredSamples.map((sample) => ({
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
    console.error('Error fetching sensor data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
