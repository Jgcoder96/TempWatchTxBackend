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

export const generateReport = async (filters: reportFilters) => {
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

    const sensorEvents = await getEventsByDate(id_sensor, {
      day,
      month,
      year,
    });

    const parseSensorEvents = parseSensorEvent(sensorEvents);

    const graph = await generateGraph(sensorData);
    await generarReportePDF(id_sensor, newDate, graph, parseSensorEvents);
  } catch (error) {
    console.log(error);
  }
};

(async () => {
  const filters: reportFilters = {
    id_sensor: '03136b1f-65e1-4d92-ae19-8ba71876cdb5',
    date: {
      day: 1,
      month: 7,
      year: 2025,
    },
  };

  await generateReport(filters);
})();
