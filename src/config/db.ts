import mongoose from "mongoose";
import type { ConnectOptions } from "mongoose"
import { env } from ".";
import { logger } from "./logger";

const connectionOptions: ConnectOptions = {
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  },
  dbName: "auth"
}

export const connectDb = async (): Promise<void> => {
  if (!env.DATABASE_URL) {
    throw new Error("Mongo URI is not set.")
  }

  try {
    await mongoose.connect(env.DATABASE_URL, connectionOptions)
    logger.info("Database connected successfully")
  } catch (err) {
    logger.error(`Failed to connect to database ${err}`)

    throw err instanceof Error ? err : new Error(`Failed to connect to database: ${err}`)

  }
}

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect()
    logger.info("Database disconnected successfully.")
  } catch (error) {
    logger.error("Error during disconnecting from database.")
  }
}
