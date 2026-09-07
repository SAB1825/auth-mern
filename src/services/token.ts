
import { env } from "@/config"
import jwt from "jsonwebtoken"

export const createTokens = (payload: string | Buffer | object) => {
  const access_token = jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: Number(env.ACCESS_TOKEN_MAX_AGE)
  })

  const refresh_token = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: Number(env.REFRESH_TOKEN_MAX_AGE)
  })

  return {
    access_token,
    refresh_token
  }
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
}
