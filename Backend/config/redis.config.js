import { createClient, createCluster } from "redis";

// Redis is optional for the lightweight single-instance deployment. This
// process-local cache keeps the API usable without provisioning Redis; use
// REDIS_URL in production when multiple API instances or durable OTPs are needed.
let redisClient;

if (!process.env.REDIS_URL && process.env.REDIS_CLUSTER !== "true") {
  const values = new Map();
  redisClient = {
    async get(key) {
      const entry = values.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt <= Date.now()) {
        values.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, options = {}) {
      values.set(key, {
        value: String(value),
        expiresAt: options.EX ? Date.now() + options.EX * 1000 : null,
      });
      return "OK";
    },
    async del(...keys) {
      return keys.reduce((deleted, key) => deleted + Number(values.delete(key)), 0);
    },
  };
  console.warn("REDIS_URL is not set; using process-local cache (single instance only)");
} else {
  const redisUrl = process.env.REDIS_URL;
  const redisClusterEnabled = process.env.REDIS_CLUSTER === "true";
  const redisNodes = (process.env.REDIS_NODES || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [host, port] = entry.split(":");
      return { url: `redis://${host}:${port}` };
    });

  if (redisClusterEnabled && redisNodes.length > 0) {
    redisClient = createCluster({
      rootNodes: redisNodes,
      defaults: {
        socket: {
          connectTimeout: 5000,
        },
      },
    });
  } else {
    redisClient = createClient({ url: redisUrl });
  }

  redisClient.on("error", (err) => console.log("Redis Client Error", err));
  redisClient.connect().then(() => {
    console.log("Redis connected");
  });
}

export default redisClient;
