export interface SensorData {
  id_sensors: string;
  voltage: number;
  temperature: number;
  status?: 'normal' | 'preventive' | 'emergency';
}
