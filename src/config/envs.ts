import { config } from 'dotenv';
import { get } from 'env-var';

config();

export const envs = {
  TELEGRAM_BOT_TOKEN: get('TELEGRAM_BOT_TOKEN').required().asString(),
  NGROK_TOKEN: get('NGROK_TOKEN').required().asString(),
};
