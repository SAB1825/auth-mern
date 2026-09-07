
import express from "express"
import type { Router } from "express"
import authRoutes from "./auth.route";

const router: Router = express.Router();

router.use("/auth", authRoutes)

export default router;
