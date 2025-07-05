import * as fs from 'fs';
import * as path from 'path';
import PdfPrinter from 'pdfmake';
import {
  TDocumentDefinitions,
  TFontDictionary,
  Content,
} from 'pdfmake/interfaces'; // CAMBIO: Se importa 'Content' para un tipado más estricto.
import { ParsedData } from '../types';

export async function generarReportePDF(
  idSensor: string,
  date: string,
  graphBuffer: Buffer,
  dataEvent: ParsedData,
): Promise<string> {
  const base64Graph = graphBuffer.toString('base64');
  const dataUriGraph = `data:image/png;base64,${base64Graph}`;

  const nombreArchivo = 'reporte.pdf';
  const fonts: TFontDictionary = {
    Roboto: {
      normal: path.resolve('src/fonts/Roboto-Regular.ttf'),
      bold: path.resolve('src/fonts/Roboto-Bold.ttf'),
      italics: path.resolve('src/fonts/Roboto-Italic.ttf'),
      bolditalics: path.resolve('src/fonts/Roboto-BoldItalic.ttf'),
    },
  };

  const printer = new PdfPrinter(fonts);

  // CAMBIO: Se crea una variable para el contenido de la tabla
  let contenidoTabla: Content = [];

  // CAMBIO: Se comprueba si hay datos en dataEvent antes de generar la tabla
  // Usamos dataEvent.date.length como referencia, asumiendo que si hay fechas, hay datos.
  if (dataEvent && dataEvent.date && dataEvent.date.length > 0) {
    // Si hay datos, generamos el encabezado y el cuerpo de la tabla
    const tableHeader = [
      { text: 'Fecha', style: 'tableHeader' },
      { text: 'Temperatura (°C)', style: 'tableHeader' },
      { text: 'Eventos del sistema', style: 'tableHeader' },
      { text: 'Velocidad del motor (RPM)', style: 'tableHeader' },
    ];

    const tableBody = dataEvent.date.map((_, index) => {
      return [
        { text: dataEvent.date[index] || '', fontSize: 10 },
        {
          text: dataEvent.temperature[index]?.toString() || 'N/A',
          fontSize: 10,
        },
        { text: dataEvent.events[index] || '', fontSize: 10 },
        { text: dataEvent.speed[index]?.toString() || 'N/A', fontSize: 10 },
      ];
    });

    // Llenamos la variable con el título y la tabla
    contenidoTabla = [
      {
        text: [
          { text: 'Tabla: ', bold: true },
          'Eventos registrados en el sistema',
        ],
        alignment: 'center',
        margin: [0, 2, 0, 10],
      },
      {
        style: 'tableExample',
        table: {
          widths: ['auto', 'auto', '*', 'auto'],
          body: [tableHeader, ...tableBody],
        },
        layout: 'lightHorizontalLines',
      },
    ];
  } else {
    // Si no hay datos, llenamos la variable con un mensaje de texto
    contenidoTabla = [
      {
        text: 'No hay eventos registrados para el período seleccionado.',
        style: 'body',
        alignment: 'center',
        margin: [0, 20, 0, 20], // Añadimos margen para que no quede pegado
      },
    ];
  }

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: {
      font: 'Roboto',
    },
    footer: function (currentPage, pageCount) {
      return {
        text: `Página ${currentPage.toString()} de ${pageCount}`,
        alignment: 'right',
        fontSize: 9,
        margin: [0, 0, 40, 0],
      };
    },
    content: [
      {
        text: [
          { text: 'Fecha de generación: ', bold: true },
          new Date().toLocaleDateString(),
        ],
        alignment: 'right',
        margin: [0, 2, 0, 20],
      },
      {
        image: path.resolve('public/logo.png'),
        width: 120,
        alignment: 'center',
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Reporte de Comportamiento Térmico del Sistema',
        style: 'header',
        alignment: 'center',
      },
      {
        text: [{ text: 'ID del sensor: ', bold: true }, idSensor],
        alignment: 'left',
        margin: [0, 15, 0, 10],
      },
      {
        text: [{ text: 'Fecha de los datos: ', bold: true }, date],
        alignment: 'left',
        margin: [0, 2, 0, 10],
      },
      {
        text: [
          { text: 'Imagen: ', bold: true },
          'Gráfica del comportamiento térmico',
        ],
        alignment: 'center',
        margin: [0, 2, 0, 10],
      },
      {
        image: dataUriGraph,
        width: 500,
        alignment: 'left',
        margin: [0, 0, 0, 20],
      },
      // CAMBIO: Usamos el operador "spread" (...) para insertar el contenido de nuestra variable
      // Esto insertará el título y la tabla si hay datos, o el mensaje de texto si no los hay.
      ...contenidoTabla,
    ],
    styles: {
      header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
      body: { fontSize: 12 },
      tableExample: { margin: [0, 5, 0, 15] },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'black',
        fillColor: '#eeeeee',
      },
    },
  };

  return new Promise<string>((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const filePath = path.resolve(nombreArchivo);
      const stream = fs.createWriteStream(filePath);
      pdfDoc.pipe(stream);
      pdfDoc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}
