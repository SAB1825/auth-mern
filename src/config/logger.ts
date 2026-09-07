import { pino } from "pino";
import { env } from ".";

const isDevelopment = env.NODE_ENV !== "production"

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  timestamp: pino.stdTimeFunctions.isoTime,

  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        igonre: "pid,hostname",
        singleLine: true,
      }
    }
  })
})
