import cluster from 'cluster';
import os from 'os';
import app from './app.js';

const numCPUs = os.cpus().length / 2; // split half for group 2

if (cluster.isPrimary) {
  console.log(`Primary 2 ${process.pid} running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  app.listen(3001, () => {
    console.log(`Group 2 Worker ${process.pid} on port 3001`);
  });
}
