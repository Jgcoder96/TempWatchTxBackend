import { event_type } from '@prisma/client';

export interface SensorDataParsed {
  sampleData: { voltage: number; temperature: number; id_sensors: string };
  eventData: {
    event: event_type;
    id_sensors: string;
  } | null;
}
