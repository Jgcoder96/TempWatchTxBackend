// botTelegraf.ts

// --- CORRECCIÓN 1: Importa la clase TelegramError ---
import { Telegraf, Markup, Context, TelegramError } from 'telegraf';
import { envs } from '../../../config';
import { getSensorList, getLastSensorSample } from '../models';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sendMainMenu = (ctx: Context, isEdit = false) => {
  const nombreUsuario = ctx.from?.first_name || 'usuario';
  const text = `¡Hola, ${nombreUsuario}! 👋\n\nBienvenido a nuestro bot. ¿Qué te gustaría hacer?`;

  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback('📝 Listar Sensores', 'ver_sensores'),
    Markup.button.callback('🔍 Monitorear Sensores', 'monitorear_sensores'),
    Markup.button.callback('📄 Generar Reporte', 'generar_reporte'),
  ]);

  if (isEdit) {
    return ctx.editMessageText(text, keyboard);
  }
  return ctx.reply(text, keyboard);
};

export const botTelegraf = () => {
  const bot = new Telegraf(envs.TELEGRAM_BOT_TOKEN);

  bot.command('menu', (ctx) => sendMainMenu(ctx));
  bot.action('volver_menu', async (ctx) => {
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

      const chunk = <T>(arr: T[], size: number): T[][] =>
        Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
          arr.slice(i * size, i * size + size),
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
    await ctx.answerCbQuery('Función no implementada todavía.');
    await ctx.editMessageText(
      'Esta función para generar reportes estará disponible pronto.',
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('⬅️ Volver al menú', 'volver_menu'),
        ]).reply_markup,
      },
    );
  });

  process.once('SIGINT', () =>
    prisma.$disconnect().then(() => bot.stop('SIGINT')),
  );
  process.once('SIGTERM', () =>
    prisma.$disconnect().then(() => bot.stop('SIGTERM')),
  );

  return bot;
};
