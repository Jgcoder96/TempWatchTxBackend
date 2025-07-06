import { Telegraf, Markup, Context, session, TelegramError } from 'telegraf';
import { envs } from '../../../config';
import { getSensorList, getLastSensorSample } from '../models';
import { PrismaClient } from '@prisma/client';
import { generateReport } from '../helpers';

const prisma = new PrismaClient();

interface ReportState {
  step: 'awaiting_date';
  sensorId: string;
}

interface MySession {
  reportState?: ReportState;
}

interface MyContext extends Context {
  session: MySession;
}

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
      return ctx.editMessageText(text, keyboard);
    }
    return ctx.reply(text, keyboard);
  } catch (error) {
    // Si editMessageText falla (ej. el mensaje es muy antiguo), envía uno nuevo.
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

  bot.action('generar_reporte', async (ctx) => {
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

      const sensorButtons = sensores.map((sensor) =>
        Markup.button.callback(
          `📄 ${sensor.name}`,
          `report_sensor:${sensor.id_sensor}`,
        ),
      );

      const keyboard = Markup.inlineKeyboard([
        ...chunk(sensorButtons, 2),
        [Markup.button.callback('⬅️ Volver al menú', 'volver_menu')],
      ]);

      await ctx.editMessageText(
        'Selecciona un sensor para generar el reporte:',
        keyboard,
      );
    } catch (error) {
      console.error('Error en generar_reporte (paso 1):', error);
      await ctx.editMessageText('❌ Ocurrió un error al cargar los sensores.');
    }
  });

  bot.action(/^report_sensor:(.+)/, async (ctx) => {
    const sensorId = ctx.match[1];

    ctx.session.reportState = {
      step: 'awaiting_date',
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

  bot.action('cancel_report', async (ctx) => {
    if (ctx.session) {
      delete ctx.session.reportState;
    }
    await ctx.answerCbQuery('Operación cancelada.');
    await sendMainMenu(ctx, true);
  });

  bot.on('text', async (ctx) => {
    if (ctx.session?.reportState?.step !== 'awaiting_date') {
      return;
    }

    const dateText = ctx.message.text;
    const sensorId = ctx.session.reportState.sensorId;

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateText.match(dateRegex);

    if (!match) {
      await ctx.reply(
        'Formato de fecha inválido. 😕\nPor favor, inténtalo de nuevo con el formato *DD/MM/AAAA*.',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    await ctx.reply('Generando tu reporte, por favor espera un momento... ⏳');

    try {
      const [, day, month, year] = match;

      const filters = {
        id_sensor: sensorId,
        date: {
          day: parseInt(day, 10),
          month: parseInt(month, 10),
          year: parseInt(year, 10),
        },
      };

      const pdfBuffer: Buffer = await generateReport(filters);

      await ctx.sendDocument(
        {
          source: pdfBuffer,
          filename: `Reporte-${sensorId}-${day}-${month}-${year}.pdf`,
        },
        {
          caption: `✅ ¡Aquí tienes tu reporte para la fecha ${dateText}!`,
        },
      );
    } catch (error) {
      console.error('Error al generar o enviar el reporte PDF:', error);
      await ctx.reply(
        '❌ Lo siento, ocurrió un error al generar tu reporte. Por favor, asegúrate de que hay datos para esa fecha e inténtalo de nuevo.',
      );
    } finally {
      delete ctx.session.reportState;
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
