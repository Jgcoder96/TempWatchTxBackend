import { Telegraf, Markup, Context, session, TelegramError } from 'telegraf';
import { envs } from '../../../config';
import { getSensorList, getLastSensorSample } from '../models';
import { PrismaClient } from '@prisma/client';
// Asumo que estas funciones existen y las simulo para que el código sea completo.
// Debes reemplazar estas implementaciones con las tuyas.
import { generateReportByDate, generateReportByRange } from '../helpers';

const prisma = new PrismaClient();

// --- NUEVAS INTERFACES Y TIPOS ---
// Interfaz de fecha proporcionada en la solicitud
interface Date {
  day: number;
  month: number;
  year: number;
}

// Interfaz para el reporte por rango, proporcionada en la solicitud
interface ReportByRangeFilters {
  id_sensor: string;
  startDate: Date;
  endDate: Date;
}

// Interfaz para el reporte por día (la que ya usabas)
interface ReportByDayFilters {
  id_sensor: string;
  date: Date;
}

// --- ESTADO DE SESIÓN AMPLIADO ---
interface ReportState {
  // Ahora tenemos más pasos para manejar el flujo del rango de fechas
  step: 'awaiting_day_date' | 'awaiting_start_date' | 'awaiting_end_date';
  sensorId: string;
  startDate?: Date; // Campo opcional para guardar la fecha de inicio
}

interface MySession {
  reportState?: ReportState;
}

interface MyContext extends Context {
  session: MySession;
}

// Función auxiliar para parsear la fecha
const parseDate = (dateText: string): Date | null => {
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateText.match(dateRegex);
  if (!match) return null;
  const [, day, month, year] = match;
  return {
    day: parseInt(day, 10),
    month: parseInt(month, 10),
    year: parseInt(year, 10),
  };
};

const sendMainMenu = (ctx: MyContext, isEdit = false) => {
  const nombreUsuario = ctx.from?.first_name || 'usuario';
  const text = `¡Hola, ${nombreUsuario}! 👋\n\nBienvenido a nuestro bot. ¿Qué te gustaría hacer?`;

  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback('📝 Listar Sensores', 'ver_sensores'),
    Markup.button.callback('🔍 Monitorear Sensores', 'monitorear_sensores'),
    Markup.button.callback('📄 Generar Reporte', 'generar_reporte'),
  ]);

  try {
    if (isEdit) {
      // Usamos catch para manejar el error "message is not modified"
      return ctx.editMessageText(text, keyboard).catch(() => {});
    }
    return ctx.reply(text, keyboard);
  } catch (error) {
    console.error('Error sending main menu, sending new message.', error);
    return ctx.reply(text, keyboard);
  }
};

export const botTelegraf = () => {
  const bot = new Telegraf<MyContext>(envs.TELEGRAM_BOT_TOKEN);

  bot.use(
    session({
      defaultSession: () => ({}),
    }),
  );

  const chunk = <T>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );

  bot.command('menu', (ctx) => sendMainMenu(ctx));

  bot.action('volver_menu', async (ctx) => {
    if (ctx.session) {
      delete ctx.session.reportState;
    }
    await ctx.answerCbQuery('Volviendo al menú principal...');
    await sendMainMenu(ctx, true);
  });

  // -- (Las acciones ver_sensores y monitorear_sensores se mantienen igual) --
  // ... (código sin cambios aquí)

  bot.action('ver_sensores', async (ctx) => {
    try {
      await ctx.answerCbQuery('Buscando sensores...');
      const sensores = await getSensorList();

      if (!sensores || sensores.length === 0) {
        return await ctx.editMessageText(
          '❌ No se encontraron sensores registrados.',
          {
            reply_markup: Markup.inlineKeyboard([
              Markup.button.callback('⬅️ Volver al menú', 'volver_menu'),
            ]).reply_markup,
          },
        );
      }

      const listaDeSensores = sensores
        .map((sensor) => `*${sensor.name}*\nID: \`${sensor.id_sensor}\``)
        .join('\n\n');

      const mensaje = `Aquí tienes la lista de sensores:\n\n${listaDeSensores}`;

      await ctx.editMessageText(mensaje, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('⬅️ Volver al menú', 'volver_menu'),
        ]).reply_markup,
      });
    } catch (error) {
      console.error('Error al obtener la lista de sensores:', error);
      await ctx.editMessageText('❌ Ocurrió un error al buscar los sensores.');
    }
  });

  bot.action('monitorear_sensores', async (ctx) => {
    try {
      await ctx.answerCbQuery('Cargando lista de sensores...');
      const sensores = await getSensorList();

      if (!sensores || sensores.length === 0) {
        return await ctx.editMessageText(
          '❌ No se encontraron sensores registrados.',
          {
            reply_markup: Markup.inlineKeyboard([
              Markup.button.callback('⬅️ Volver al menú', 'volver_menu'),
            ]).reply_markup,
          },
        );
      }

      const sensorButtons = sensores.map((sensor) =>
        Markup.button.callback(
          `📡 ${sensor.name}`,
          `monitor:${sensor.id_sensor}`,
        ),
      );

      const keyboard = Markup.inlineKeyboard([
        ...chunk(sensorButtons, 2),
        [Markup.button.callback('⬅️ Volver al menú', 'volver_menu')],
      ]);

      await ctx.editMessageText(
        '🔍 Elige el sensor que quieres monitorear:',
        keyboard,
      );
    } catch (error) {
      console.error('Error al crear el menú de monitoreo:', error);
      await ctx.editMessageText('❌ Ocurrió un error al cargar los sensores.');
    }
  });

  bot.action(/^monitor:(.+)/, async (ctx) => {
    try {
      const sensorId = ctx.match[1];
      await ctx.answerCbQuery(`Actualizando datos...`);

      const [data, sensorInfo] = await Promise.all([
        getLastSensorSample(sensorId),
        prisma.sensors.findUnique({
          where: { id_sensor: sensorId },
          select: { name: true },
        }),
      ]);

      const sensorName = sensorInfo?.name || 'Sensor Desconocido';

      if (!data) {
        return await ctx.editMessageText(
          `❌ No se encontraron datos para ${sensorName}.`,
          {
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  '⬅️ Volver a la lista',
                  'monitorear_sensores',
                ),
              ],
            ]).reply_markup,
          },
        );
      }

      const message =
        `📊 *Último estado de: ${sensorName}*\n\n` +
        `🌡️ *Temperatura:* \`${data.temperature}\`\n` +
        `⚡ *Último Evento:* \`${data.event}\`\n` +
        `⚙️ *Última Velocidad:* \`${data.speed}\``;

      const monitoringKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🔄 Actualizar', `monitor:${sensorId}`),
          Markup.button.callback('⬅️ Volver a la lista', 'monitorear_sensores'),
        ],
      ]);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: monitoringKeyboard.reply_markup,
      });
    } catch (error) {
      if (
        error instanceof TelegramError &&
        error.description.includes('message is not modified')
      ) {
        return ctx.answerCbQuery('No hay datos nuevos.', { show_alert: false });
      }
      console.error('Error al monitorear el sensor:', error);
      await ctx.reply('❌ Ocurrió un error al obtener los datos del sensor.');
    }
  });

  // --- SECCIÓN DE REPORTES MODIFICADA ---

  // NUEVO PASO 1: Elegir el tipo de reporte
  bot.action('generar_reporte', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '📄 Elige el tipo de reporte que deseas generar:';
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback('Por Día', 'report_by_day'),
      Markup.button.callback('Por Rango de Fechas', 'report_by_range'),
      Markup.button.callback('⬅️ Volver al menú', 'volver_menu'),
    ]);
    await ctx.editMessageText(text, keyboard);
  });

  // Función de ayuda para mostrar la lista de sensores y evitar duplicar código
  const showSensorSelectionForReport = async (
    ctx: MyContext,
    reportType: 'day' | 'range',
  ) => {
    try {
      await ctx.answerCbQuery('Cargando lista de sensores...');
      const sensores = await getSensorList();

      if (!sensores || sensores.length === 0) {
        return await ctx.editMessageText('❌ No se encontraron sensores.', {
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback('⬅️ Volver al menú', 'volver_menu'),
          ]).reply_markup,
        });
      }

      // El prefijo del callback cambia según el tipo de reporte
      const callbackPrefix =
        reportType === 'day' ? 'report_sensor_day' : 'report_sensor_range';

      const sensorButtons = sensores.map((sensor) =>
        Markup.button.callback(
          `📄 ${sensor.name}`,
          `${callbackPrefix}:${sensor.id_sensor}`,
        ),
      );

      const keyboard = Markup.inlineKeyboard([
        ...chunk(sensorButtons, 2),
        [Markup.button.callback('⬅️ Volver', 'generar_reporte')],
      ]);

      await ctx.editMessageText(
        'Selecciona un sensor para generar el reporte:',
        keyboard,
      );
    } catch (error) {
      console.error(
        `Error en showSensorSelectionForReport (${reportType}):`,
        error,
      );
      await ctx.editMessageText('❌ Ocurrió un error al cargar los sensores.');
    }
  };

  // PASO 2 (Opción A): El usuario eligió "Por Día"
  bot.action('report_by_day', (ctx) =>
    showSensorSelectionForReport(ctx, 'day'),
  );

  // PASO 2 (Opción B): El usuario eligió "Por Rango"
  bot.action('report_by_range', (ctx) =>
    showSensorSelectionForReport(ctx, 'range'),
  );

  // PASO 3 (Flujo por Día): El usuario seleccionó un sensor para el reporte diario
  bot.action(/^report_sensor_day:(.+)/, async (ctx) => {
    const sensorId = ctx.match[1];
    ctx.session.reportState = {
      step: 'awaiting_day_date', // Estado específico para fecha de día
      sensorId: sensorId,
    };
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📅 Por favor, ingresa la fecha para el reporte.\n\nUsa el formato: *DD/MM/AAAA*',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('❌ Cancelar', 'cancel_report'),
        ]).reply_markup,
      },
    );
  });

  // PASO 3 (Flujo por Rango): El usuario seleccionó un sensor para el reporte por rango
  bot.action(/^report_sensor_range:(.+)/, async (ctx) => {
    const sensorId = ctx.match[1];
    ctx.session.reportState = {
      step: 'awaiting_start_date', // Estado para la fecha de inicio
      sensorId: sensorId,
    };
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🗓️ Por favor, ingresa la *fecha de inicio* del rango.\n\nUsa el formato: *DD/MM/AAAA*',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('❌ Cancelar', 'cancel_report'),
        ]).reply_markup,
      },
    );
  });

  bot.action('cancel_report', async (ctx) => {
    if (ctx.session) {
      delete ctx.session.reportState;
    }
    await ctx.answerCbQuery('Operación cancelada.');
    // Regresa al menú de selección de tipo de reporte
    await ctx.editMessageText(
      '📄 Elige el tipo de reporte que deseas generar:',
      Markup.inlineKeyboard([
        Markup.button.callback('Por Día', 'report_by_day'),
        Markup.button.callback('Por Rango de Fechas', 'report_by_range'),
        Markup.button.callback('⬅️ Volver al menú', 'volver_menu'),
      ]),
    );
  });

  // MANEJADOR DE TEXTO CENTRALIZADO para recibir las fechas
  bot.on('text', async (ctx) => {
    // Si no estamos esperando una fecha, no hacemos nada
    if (!ctx.session?.reportState?.step) {
      return;
    }

    const { reportState } = ctx.session;
    const dateText = ctx.message.text;
    const parsedDate = parseDate(dateText);

    if (!parsedDate) {
      await ctx.reply(
        'Formato de fecha inválido. 😕\nPor favor, inténtalo de nuevo con el formato *DD/MM/AAAA*.',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    // Usamos un switch para manejar los diferentes pasos del proceso
    switch (reportState.step) {
      case 'awaiting_day_date': {
        await ctx.reply('Generando tu reporte diario, por favor espera... ⏳');
        try {
          const filters: ReportByDayFilters = {
            id_sensor: reportState.sensorId,
            date: parsedDate,
          };

          const pdfBuffer: Buffer = await generateReportByDate(filters);

          await ctx.sendDocument(
            {
              source: pdfBuffer,
              filename: `Reporte-${filters.id_sensor}-${dateText.replace(/\//g, '-')}.pdf`,
            },
            {
              caption: `✅ ¡Aquí tienes tu reporte para la fecha ${dateText}!`,
            },
          );
        } catch (error) {
          console.error('Error al generar reporte por día:', error);
          await ctx.reply('❌ Ocurrió un error al generar tu reporte.');
        } finally {
          delete ctx.session.reportState; // Limpiamos la sesión
        }
        break;
      }

      case 'awaiting_start_date': {
        // Guardamos la fecha de inicio y pasamos al siguiente paso
        reportState.startDate = parsedDate;
        reportState.step = 'awaiting_end_date';
        await ctx.reply(
          '✅ Fecha de inicio guardada.\n\nAhora, ingresa la *fecha de fin* del rango.\n\nUsa el formato: *DD/MM/AAAA*',
          { parse_mode: 'Markdown' },
        );
        break;
      }

      case 'awaiting_end_date': {
        const startDate = reportState.startDate!;
        const endDate = parsedDate;

        // Validación: la fecha de fin no puede ser anterior a la de inicio
        const startDateTime = new Date(
          startDate.year,
          startDate.month - 1,
          startDate.day,
        ).getTime();
        const endDateTime = new Date(
          endDate.year,
          endDate.month - 1,
          endDate.day,
        ).getTime();

        if (endDateTime < startDateTime) {
          await ctx.reply(
            '❌ La fecha de fin no puede ser anterior a la fecha de inicio. Por favor, ingresa una *fecha de fin* válida.',
            { parse_mode: 'Markdown' },
          );
          return; // No cambiamos el estado, el usuario debe intentarlo de nuevo.
        }

        // --- NUEVA VALIDACIÓN: LÍMITE DE 5 DÍAS ---
        const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
        const differenceInDays = (endDateTime - startDateTime) / ONE_DAY_IN_MS;

        // Comprobamos si la diferencia es mayor a 5 días
        // Ej: del 1 al 7 son 6 días de diferencia.
        if (differenceInDays > 5) {
          await ctx.reply(
            '❌ El rango solicitado supera el límite de 5 días.\n\nPor favor, ingresa una *fecha de fin* que esté dentro del límite permitido.',
            { parse_mode: 'Markdown' },
          );
          return; // Salimos y esperamos una nueva fecha de fin, sin cambiar el estado.
        }
        // --- FIN DE LA NUEVA VALIDACIÓN ---

        await ctx.reply(
          'Generando tu reporte por rango, por favor espera... ⏳',
        );
        try {
          const filters: ReportByRangeFilters = {
            id_sensor: reportState.sensorId,
            startDate: startDate,
            endDate: endDate,
          };

          // Aquí llamas a tu nueva función para generar el reporte por rango
          const pdfBuffer: Buffer = await generateReportByRange(filters);

          const startDateString = `${startDate.day.toString().padStart(2, '0')}/${startDate.month.toString().padStart(2, '0')}/${startDate.year}`;
          const endDateString = `${endDate.day.toString().padStart(2, '0')}/${endDate.month.toString().padStart(2, '0')}/${endDate.year}`;

          await ctx.sendDocument(
            {
              source: pdfBuffer,
              filename: `Reporte-${filters.id_sensor}-${startDateString.replace(/\//g, '-')}_a_${endDateString.replace(/\//g, '-')}.pdf`,
            },
            {
              caption: `✅ ¡Aquí tienes tu reporte del ${startDateString} al ${endDateString}!`,
            },
          );
        } catch (error) {
          console.error('Error al generar reporte por rango:', error);
          await ctx.reply('❌ Ocurrió un error al generar tu reporte.');
        } finally {
          delete ctx.session.reportState; // Limpiamos la sesión
        }
        break;
      }
    }
  });

  process.once('SIGINT', () =>
    prisma.$disconnect().then(() => bot.stop('SIGINT')),
  );
  process.once('SIGTERM', () =>
    prisma.$disconnect().then(() => bot.stop('SIGTERM')),
  );

  return bot;
};
