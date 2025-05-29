import cluster from 'cluster';
import os from 'os';
import app from './app.js';

const numCPUs = os.cpus().length / 2; // split half for group 1

if (cluster.isPrimary) {
  console.log(`Primary 1 ${process.pid} running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  app.listen(3000, () => {
    console.log(`Group 1 Worker ${process.pid} on port 3000`);
  });
}
