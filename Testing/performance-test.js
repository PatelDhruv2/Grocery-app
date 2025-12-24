import http from 'http';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5000';
const TEST_DURATION = 10000; // 10 seconds
const CONCURRENT_REQUESTS = 50;

let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let responseTimes = [];
let startTime;

// Test endpoints
const endpoints = [
  { path: '/', method: 'GET' },
  { path: '/products/productimage', method: 'GET' },
  { path: '/stats/totalproducts', method: 'GET' },
];

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + endpoint.path);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const reqStart = performance.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const reqEnd = performance.now();
        const duration = reqEnd - reqStart;
        responseTimes.push(duration);
        
        totalRequests++;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      totalRequests++;
      failedRequests++;
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      totalRequests++;
      failedRequests++;
      resolve();
    });

    req.end();
  });
}

async function runLoadTest() {
  console.log('🚀 Starting Performance Test...\n');
  console.log(`Test Duration: ${TEST_DURATION / 1000} seconds`);
  console.log(`Concurrent Requests: ${CONCURRENT_REQUESTS}\n`);
  
  startTime = performance.now();
  const endTime = startTime + TEST_DURATION;

  const workers = [];
  
  // Create worker function
  const worker = async () => {
    while (performance.now() < endTime) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      await makeRequest(endpoint);
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };

  // Start concurrent workers
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    workers.push(worker());
  }

  // Wait for all workers to complete
  await Promise.all(workers);

  // Calculate statistics
  const actualDuration = (performance.now() - startTime) / 1000;
  const requestsPerSecond = totalRequests / actualDuration;
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const sortedTimes = responseTimes.sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${failedRequests} (${((failedRequests / totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Test Duration: ${actualDuration.toFixed(2)} seconds`);
  console.log(`\n⚡ REQUESTS PER SECOND: ${requestsPerSecond.toFixed(2)} req/s`);
  console.log(`\n📈 RESPONSE TIME STATISTICS:`);
  console.log(`  Average: ${avgResponseTime.toFixed(2)} ms`);
  console.log(`  P50 (Median): ${p50.toFixed(2)} ms`);
  console.log(`  P95: ${p95.toFixed(2)} ms`);
  console.log(`  P99: ${p99.toFixed(2)} ms`);
  console.log(`  Min: ${Math.min(...responseTimes).toFixed(2)} ms`);
  console.log(`  Max: ${Math.max(...responseTimes).toFixed(2)} ms`);
  console.log('='.repeat(60) + '\n');
}

// Run the test
runLoadTest().catch(console.error);

