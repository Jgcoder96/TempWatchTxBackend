import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  ChartItem,
} from 'chart.js';
import { Canvas } from 'skia-canvas';
import 'chartjs-adapter-date-fns';

interface Data {
  temperature: number;
  date: Date;
}

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
);

function roundUpToNearest(value: number, multiple: number) {
  return Math.ceil(value / multiple) * multiple;
}

function roundDownToNearest(value: number, multiple: number) {
  return Math.floor(value / multiple) * multiple;
}

export const generateGraph = async (data: Data[]) => {
  try {
    const temperaturas = data.map((d) => d.temperature);
    const maxTemp = Math.max(...temperaturas);

    let roundMultiple;
    if (maxTemp <= 10) {
      roundMultiple = 1;
    } else if (maxTemp <= 50) {
      roundMultiple = 5;
    } else if (maxTemp <= 100) {
      roundMultiple = 10;
    } else {
      roundMultiple = 25;
    }

    const maxRounded = roundUpToNearest(maxTemp, roundMultiple);
    const stepSize = roundMultiple;

    const tiempos = data.map((d) => new Date(d.date).getTime());
    const minTime = roundDownToNearest(Math.min(...tiempos), 1000 * 60 * 60); // Redondea a la hora inferior
    const maxTime = roundUpToNearest(Math.max(...tiempos), 1000 * 60 * 60); // Redondea a la hora superior

    const canvas = new Canvas(1200, 500);

    const chart = new Chart(canvas as unknown as ChartItem, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: data.map((d) => ({
              x: new Date(d.date).getTime(),
              y: d.temperature,
            })),
            borderColor: '#4CAF50',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 0,
            showLine: true,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        elements: {
          line: {
            tension: 0.1,
          },
          point: {
            radius: 0,
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'hour',
              tooltipFormat: 'HH:mm',
              displayFormats: {
                hour: 'HH:mm',
              },
            },
            title: {
              display: true,
              text: 'Hora del día',
              font: {
                weight: 'bold',
                size: 14,
              },
            },
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 45,
              major: {
                enabled: true,
              },
              font: {
                size: 12,
              },
            },
            min: minTime,
            max: maxTime,
            grid: {
              color: (ctx) => {
                if (ctx.tick && 'major' in ctx.tick && ctx.tick.major) {
                  return 'rgba(0, 0, 0, 0.2)';
                }
                return 'rgba(0, 0, 0, 0.05)';
              },
            },
          },
          y: {
            title: {
              display: true,
              text: 'Temperatura (°C)',
              font: {
                weight: 'bold',
                size: 14,
              },
            },
            min: 0,
            max: maxRounded,
            ticks: {
              stepSize: stepSize,
              font: {
                size: 12,
              },
              callback: function (value) {
                return value + '°C';
              },
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Registro de Temperatura - 19 de Junio 2025',
            font: {
              size: 18,
              weight: 'bold',
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 12,
              },
              padding: 20,
              usePointStyle: false,
            },
          },
          tooltip: {
            callbacks: {
              title: (context) => {
                const firstContext = context[0];
                if (!firstContext || firstContext.parsed.x === undefined)
                  return '';
                const date = new Date(firstContext.parsed.x);
                return date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              },
              label: (context) => {
                return `Temperatura: ${context.parsed.y.toFixed(1)} °C`;
              },
            },
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 12,
            },
            padding: 10,
            cornerRadius: 5,
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
    });

    const pngBuffer = await canvas.toBuffer('png', { matte: 'white' });
    chart.destroy();
    return pngBuffer;
  } catch (error) {
    console.error('❌ Error al generar el gráfico:', error);
    throw error;
  }
};
