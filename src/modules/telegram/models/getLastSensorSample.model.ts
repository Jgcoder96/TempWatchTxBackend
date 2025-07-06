import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const getLastSensorSample = async (sensorId: string) => {
  const prisma = new PrismaClient();
  try {
    const latestSamplePromise = prisma.sensor_samples.findFirst({
      where: { id_sensor: sensorId },
      orderBy: { date: 'desc' },
      select: { temperature: true },
    });

    const latestEventPromise = prisma.sensor_events.findFirst({
      where: {
        sample: {
          id_sensor: sensorId,
        },
      },
      orderBy: {
        sample: {
          date: 'desc',
        },
      },
      select: { event: true },
    });

    const latestSpeedPromise = prisma.motor_events.findFirst({
      where: {
        sample: {
          id_sensor: sensorId,
        },
      },
      orderBy: {
        sample: {
          date: 'desc',
        },
      },
      select: { speed: true },
    });

    const [latestSample, latestEvent, latestSpeed] = await Promise.all([
      latestSamplePromise,
      latestEventPromise,
      latestSpeedPromise,
    ]);

    const result = {
      temperature: latestSample?.temperature ?? '',
      event: latestEvent?.event ?? '',
      speed: latestSpeed?.speed ?? '',
    };

    return result;
  } catch (error) {
    if (!(error instanceof PrismaClientKnownRequestError)) throw error;
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};
