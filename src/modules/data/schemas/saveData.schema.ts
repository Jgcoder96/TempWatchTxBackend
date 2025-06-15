import z from 'zod';

const sensorData = z.object({
  id_sensors: z.string(),
  voltage: z.number(),
  temperature: z.number().min(-100).max(200),
});

export const sensorDataArray = z.array(sensorData);

export const saveData = z.object({
  data: sensorDataArray,
});
