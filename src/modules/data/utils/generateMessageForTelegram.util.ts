import { SensorData } from '../types/';

export const generateMessageForTelegram = (
  sensorData: SensorData[],
): string[] => {
  return sensorData
    .filter(
      (sensor) =>
        sensor.status !== undefined && sensor.motor_speed !== undefined,
    )
    .map((sensor) => {
      let icon = '❓';
      let statusText = `Estado Desconocido (${sensor.status})`;

      switch (sensor.status) {
        case 'normal':
          icon = '✅';
          statusText = 'Estado Normal';
          break;
        case 'preventive':
          icon = '⚠️';
          statusText = 'Alerta Preventiva';
          break;
        case 'emergency':
          icon = '🚨';
          statusText = '¡EMERGENCIA!';
          break;
      }

      return `${icon} *${statusText}* en Sensor *${sensor.id_sensor}*
   - Temperatura: *${sensor.temperature}°C* 🌡️
   - Estado técnico: *${sensor.status}*
   - Velocidad del motor: *${sensor.motor_speed}* ⚙️`;
    });
};
