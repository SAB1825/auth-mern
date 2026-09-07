import { verifyToken } from "@/services/token";
import type { Request, Response } from "express";
import { Types } from "mongoose";
import { getUser } from "../services/user";
import { logger } from "@/config/logger";

export const getMe = async (req: Request, res: Response) => {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(401).json({
      code: "AccessTokenError",
      message: "Access token is required",
    });
    return;
  }

  const [scheme, accessToken] = authorization?.split(" ");

  if (scheme !== "Bearer" || !accessToken) {
    res.status(401).json({
      code: "AccessTokenError",
      message: "Malformed authorization header",
    });
  }

  let userId: Types.ObjectId;

  try {
    ({ userId } = verifyToken(accessToken) as { userId: Types.ObjectId });
  } catch (error) {
    res.status(401).json({
      code: "AccesToken",
      message: "Access token is invalid or expired",
    });

    return;
  }
  try {
    const me = await getUser(userId);
    res.json(me);
  } catch (error) {
    logger.error(error, "Error while getting user info.");
    res.sendStatus(500);
  }
};
