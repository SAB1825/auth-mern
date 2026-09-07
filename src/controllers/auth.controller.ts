import type { Request, Response } from "express";
import crypto from "crypto";
import { google } from "googleapis";

import { oauth2Client } from "@/utils/oauth2Client";
import { env } from "@/config";
import { logger } from "@/config/logger";
import { IUser, User } from "@/models/user";
import { createUser } from "@/services/user";
import { createTokens } from "@/services/token"

export const googleAuth = (req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString("hex");

  req.session.state = state;
  console.log(state)
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: env.GOOGLE_SCOPES,
    include_granted_scopes: true,
    state,
  });

  res.redirect(authorizationUrl);
};

export const googleAuthCallback = async (
  req: Request,
  res: Response,
) => {
  const { error, state, code } = req.query;

  if (error) {
    return res.status(400).json({
      message: "Google OAuth authorization failed",
      error,
    });
  }
  console.log(state)
  if (
    typeof state !== "string" ||
    state !== req.session.state
  ) {
    return res.status(400).json({
      message: "State mismatch. Possible CSRF attack",
    });
  }

  req.session.state = undefined;

  if (typeof code !== "string") {
    return res.status(400).json({
      message: "Missing authorization code",
    });
  }

  let userInfo;

  try {
    const { tokens: googleTokens } =
      await oauth2Client.getToken(code);

    oauth2Client.setCredentials(googleTokens);

    const peopleApi = google.people({
      version: "v1",
      auth: oauth2Client,
    });

    const { data } = await peopleApi.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses,photos",
    });

    userInfo = data;
  } catch (err) {
    logger.error(`Google OAuth flow failed: ${err}`);

    return res.sendStatus(502);
  }

  const firstName = userInfo.names?.[0]?.givenName;
  const lastName = userInfo.names?.[0]?.familyName;
  const email = userInfo.emailAddresses?.[0]?.value;
  const profilePicture = userInfo.photos?.[0]?.url;

  if (!firstName || !lastName || !email || !profilePicture) {
    logger.error("Didn't get necessary information from Google");

    return res.sendStatus(500);
  }

  const userExist = await User.exists({
    email: email
  })

  let userId = userExist?._id;

  if (!userExist) {
    try {
      const user: IUser = {
        name: {
          first: firstName,
          last: lastName
        },
        email: email,
        photo: {
          url: profilePicture
        },
      }
      const newUser = await createUser(user)
      userId = newUser?._id
      console.log(newUser)
    } catch (error) {
      logger.error(error, "Error creating new user")
    }
  }

  if (!userId) {
    logger.error("Unable to resolve user id for token creation")
    return res.sendStatus(500)
  }

  const tokens = createTokens({ userId })

  res.cookie('access_token', tokens.access_token, {
    secure: env.IS_PRODUCTION,
    sameSite: "lax",
    maxAge: Number(env.ACCESS_TOKEN_MAX_AGE)
  });

  res.cookie('refresh_token', tokens.refresh_token, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: "lax",
    maxAge: Number(env.REFRESH_TOKEN_MAX_AGE),
  })

  res.redirect(`${env.CLIENT_URL}/app`)
};
