import { ParsedData } from '../types';

interface Event {
  date: string;
  id_sample: number | null;
  id_event: number;
  event: string;
}

interface MotorEvent {
  date: string;
  id_sample: number | null;
  id_motor_event: number;
  speed: string;
}

interface SampleData {
  date: string;
  events: Event[];
  motor_events: MotorEvent[];
  id_sensor: string;
  id_sample: number;
  voltage: number;
  temperature: number;
}

export const parseSensorEvent = (array: SampleData[]): ParsedData => {
  const dataParsed: ParsedData = {
    date: [],
    temperature: [],
    events: [],
    speed: [],
  };

  array.forEach((item: SampleData) => {
    const formattedDate = formatDate(item.date);
    dataParsed.date.push(formattedDate);

    dataParsed.temperature.push(item.temperature);

    const event = item.events.length > 0 ? item.events[0].event : '';
    dataParsed.events.push(event);

    const speed =
      item.motor_events.length > 0 ? item.motor_events[0].speed : '';
    dataParsed.speed.push(speed);
  });

  return dataParsed;
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Meses van de 0-11
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}
