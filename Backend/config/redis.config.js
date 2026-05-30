import { createClient, createCluster } from "redis";

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

let redisClient;

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
  redisClient = createClient({
    url: redisUrl || "redis://127.0.0.1:6379",
  });
}

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect().then(() => {
  console.log("Redis connected");
});

export default redisClient;
