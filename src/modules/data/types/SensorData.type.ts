export interface SensorData {
  id_sensor: string;
  voltage: number;
  temperature: number;
  status?: 'normal' | 'preventive' | 'emergency';
  motor_speed?: 'off' | 'normal' | 'high';
}
