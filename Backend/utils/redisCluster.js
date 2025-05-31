import Redis from 'ioredis'

const cluster = new Redis.Cluster([
  {
    host: '127.0.0.1', // Or your Docker host IP
    port: 7001,
  },
  {
    host: '127.0.0.1',
    port: 7002,
  },
  {
    host: '127.0.0.1',
    port: 7003,
  },
    {
    host: '127.0.0.1', // Or your Docker host IP
    port: 7004,
  },
  {
    host: '127.0.0.1',
    port: 7005,
  },
  {
    host: '127.0.0.1',
    port: 7006,
  },
    {
    host: '127.0.0.1', // Or your Docker host IP
    port: 7007,
  },
  {
    host: '127.0.0.1',
    port: 7008,
  }
]);

cluster.on('connect', () => {
  console.log('Connected to Redis Cluster');
});

cluster.on('error', (err) => {
  console.error('Redis Cluster error', err);
});

module.exports = cluster;
