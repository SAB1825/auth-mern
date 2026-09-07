import { googleAuth, googleAuthCallback } from "@/controllers/auth.controller";
import express from "express"

import type { Router } from "express"

const authRoutes: Router = express.Router();

authRoutes.get("/google", googleAuth)
authRoutes.get("/google/callback", googleAuthCallback)

export default authRoutes
