import pino from "pino";

// Usar logger simples no desenvolvimento para evitar problemas com worker
const logger = process.env.NODE_ENV === "development"
  ? {
      info: (obj: any, msg?: string) => console.log('[INFO]', obj, msg || ''),
      error: (obj: any, msg?: string) => console.error('[ERROR]', obj, msg || ''),
      warn: (obj: any, msg?: string) => console.warn('[WARN]', obj, msg || ''),
      debug: (obj: any, msg?: string) => console.debug('[DEBUG]', obj, msg || ''),
    }
  : pino({
      level: process.env.LOG_LEVEL || "info",
    });

export default logger;
