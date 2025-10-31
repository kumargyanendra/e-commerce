import express from "express";
import dotenv from 'dotenv';
import { signup, login, logout, refreshToken,getProfile } from "../controllers/auth.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
dotenv.config();

const router = express.Router();

router.post("/signup", signup);

router.post("/login",  login);

router.post("/logout", logout);

router.post("/refresh-token", refreshToken);

router.get("/profile",protectedRoute, getProfile);

export default router;