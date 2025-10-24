// controllers/auth.controller.js
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";
import dotenv from "dotenv";
dotenv.config();

// token helpers (as before)
const generateTokens = (userId) => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("Missing JWT secrets");
  }
  const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

const storeRefreshTokenInRedis = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, { ex: 7 * 24 * 60 * 60 });
};

const setCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, { httpOnly: true, secure: isProd, sameSite: "Strict", maxAge: 24*60*60*1000, path: "/" });
  res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: isProd, sameSite: "Strict", maxAge: 7*24*60*60*1000, path: "/" });
};

export const signup = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: "username, email and password required" });

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // create user — pre-save hook will hash password
    const user = await User.create({ name: username, email, password });

    // generate tokens & store cookie/redis
    const { accessToken, refreshToken } = generateTokens(user._id);
    setCookies(res, accessToken, refreshToken);
    await storeRefreshTokenInRedis(user._id.toString(), refreshToken);

    // Return full user object (contains hashed password)
    // NOTE: user is a Mongoose document; convert to plain object if you want
    const fullUser = user.toObject(); // includes hashed password

    return res.status(201).json({
      message: "User created successfully",
      user: fullUser,
      tokens: { accessToken, refreshToken }, // optional
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // if your schema hides password with select:false, explicitly include it
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // generate tokens, set cookies and store refresh token in Redis
    const { accessToken, refreshToken } = generateTokens(user._id);
    setCookies(res, accessToken, refreshToken); // synchronous
    await storeRefreshTokenInRedis(user._id.toString(), refreshToken);

    // safe response (do not send password or full user object)
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const logout = async (req, res) => {
try{
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        const decode=jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        await redis.del(`refresh_token:${decode.id}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
}
catch(err){
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" , error: err.message});
}
}



export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.id}`);

    if (storedToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const accessToken = jwt.sign({ id: decoded.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);
    res.cookie("accessToken", newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Strict", maxAge: 15*60*1000 });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};