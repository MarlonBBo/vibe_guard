import pino, { type DestinationStream, type Logger } from 'pino';

import type { AppConfig } from '../config/env.js';

export function createLogger(
  config: Pick<AppConfig, 'LOG_LEVEL'>,
  service: string,
  destination?: DestinationStream,
): Logger {
  return pino({
    level: config.LOG_LEVEL,
    base: { service },
    redact: {
      paths: ['DATABASE_URL', 'REDIS_URL', '*.DATABASE_URL', '*.REDIS_URL'],
      censor: '[REDACTED]',
    },
  }, destination);
}
