import { getDataByRange, getEventsByRange } from '../models';
import { generateGraph, generatePDFByRange, parseSensorEvent } from '../utils';

interface Date {
  day: number;
  month: number;
  year: number;
}
interface reportFilters {
  id_sensor: string;
  startDate: Date;
  endDate: Date;
}

export const generateReport = async (
  filters: reportFilters,
): Promise<Buffer> => {
  try {
    const { id_sensor, startDate, endDate }: reportFilters = filters;

    const { day: startDay, month: startMonth, year: startYear } = startDate;
    const { day: endDay, month: endMonth, year: endYear } = endDate;

    const newStartDate: string = new Date(
      startYear,
      startMonth - 1,
      startDay,
    ).toLocaleDateString();
    const newEndDate: string = new Date(
      endYear,
      endMonth - 1,
      endDay,
    ).toLocaleDateString();

    const sensorData = await getDataByRange({ startDate, endDate }, id_sensor);

    const sensorEvents = await getEventsByRange(
      { startDate, endDate },
      id_sensor,
    );

    const parseSensorEvents = parseSensorEvent(sensorEvents);

    const graph = await generateGraph(sensorData);

    const report: Buffer = await generatePDFByRange(
      id_sensor,
      newStartDate,
      newEndDate,
      graph,
      parseSensorEvents,
    );
    return report;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
