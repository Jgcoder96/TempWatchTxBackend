export interface SensorDataParsed {
  sampleData: { voltage: number; temperature: number; id_sensor: string };
  eventData: {
    event: string;
    motor_speed: string;
  } | null;
}
