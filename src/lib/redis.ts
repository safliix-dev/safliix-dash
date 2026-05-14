import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, {
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export { redis };
