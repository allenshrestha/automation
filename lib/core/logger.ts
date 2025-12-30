import pino from 'pino';
import { Config } from './config';

/**
 * STRUCTURED LOGGER
 */
export const logger = pino({
  level: Config.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{msg} {context}',
    },
  },
});

export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}