import { getDataByDate, getEventsByDate } from '../models';
import { generateGraph } from './generateGraph.helper';
import { generarReportePDF } from './generatePdf.helper';
import { parseSensorEvent } from '../utils';

interface reportFilters {
  id_sensor: string;
  date: {
    day: number;
    month: number;
    year: number;
  };
}

export const generateReport = async (
  filters: reportFilters,
): Promise<Buffer> => {
  try {
    const { id_sensor, date }: reportFilters = filters;

    const { day, month, year } = date;

    const newDate: string = new Date(year, month - 1, day).toLocaleDateString();

    const sensorData = await getDataByDate(
      {
        day,
        month,
        year,
      },
      id_sensor,
    );

    console.log(sensorData);

    const sensorEvents = await getEventsByDate(id_sensor, {
      day,
      month,
      year,
    });

    const parseSensorEvents = parseSensorEvent(sensorEvents);

    const graph = await generateGraph(sensorData);
    const report: Buffer = await generarReportePDF(
      id_sensor,
      newDate,
      graph,
      parseSensorEvents,
    );
    return report;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
