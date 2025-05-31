import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379,
  },
});

console.log('Connecting to Redis...');

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().then(() => {
  console.log("✅ Redis connected");
});



export default redisClient;
