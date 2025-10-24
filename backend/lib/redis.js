import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// const testRedis = async () => {
//   await redis.set("foo", "bar");
//   const value = await redis.get("foo");
//   console.log("✅ Redis connected, foo =", value);
// };

// testRedis().catch(console.error);
