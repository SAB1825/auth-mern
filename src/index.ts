import express from "express";
import cors from "cors";
import session from "express-session";
import helmet from "helmet"
import { logger } from "./config/logger";
import { env } from "./config";
import cookieParser from "cookie-parser";
import router from "@/router/index";
import { connectDb, disconnectDB } from "./config/db";

const app = express()

app.use(
  cors({
    origin: [env.CLIENT_URL],
    credentials: true,
  }),
  express.json(),
  helmet(),
  cookieParser(),
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.IS_PRODUCTION,
      sameSite: "lax",
      maxAge: 36e5
    }
  })
);


(async function(): Promise<void> {
  try {
    await connectDb()
    app.use("/api/v1", router)

    app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("Unhandled Request Error", err);

      if (res.headersSent) return;

      res.status(500).json({
        code: "ServerError",
        message: "An unknown error occured."
      })
    })

    app.listen(env.PORT, () => {
      logger.info("Server started at 3000")
    })
  } catch (error) {
    logger.error("Failed to start server");
    logger.error(error)
    if (env.NODE_ENV === "production") {
      process.exit(1)
    }
  }
})()

const serverTermination = async (signal: NodeJS.Signals): Promise<void> => {
  try {

    await disconnectDB()
    logger.warn("Server is shutting down.")
    process.exit(0);
  } catch (err) {
    logger.error("Error during server shutdown")
    logger.error(err);
    process.exit(1);
  }
}

process.on("SIGTERM", serverTermination)
process.on("SIGINT", serverTermination)
