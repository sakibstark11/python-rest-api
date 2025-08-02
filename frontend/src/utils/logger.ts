import pino from 'pino';

const logger = pino({
  level: import.meta.env.DEV ? 'debug' : 'info',
  browser: {
    asObject: true,
  },
  transport: import.meta.env.DEV ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

export default logger;
