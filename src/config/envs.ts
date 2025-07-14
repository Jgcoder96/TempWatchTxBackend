import { config } from 'dotenv';
import { get } from 'env-var';

config();

export const envs = {
  TELEGRAM_BOT_TOKEN: get('TELEGRAM_BOT_TOKEN').required().asString(),
  URL: get('URL').required().asString(),
  PORT: get('PORT').default('8080').asPortNumber(),
};
