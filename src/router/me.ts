import { getMe } from "@/controllers/user.controller";
import express from "express";
import type { Router } from "express";

const router: Router = express.Router();


router.get("/me", getMe);

export default router
