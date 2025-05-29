import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 500 },  // ramp up
    { duration: '30s', target: 500 },  // steady
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% requests below 2s
    'checks{check:Login successful}': ['rate>0.95'],
  },
};

export default function () {
  const BASE_URL = 'http://localhost/api';
  const userId = Math.floor(Math.random() * 500) + 1; // random user 1-500

  const payload = JSON.stringify({
    email: `user${userId}@example.com`,
    password: 'Password123',
  });

  const headers = { 'Content-Type': 'application/json' };

  const res = http.post(`${BASE_URL}/userLogin`, payload, { headers });

  check(res, { 'Login successful': (r) => r.status === 200 });

  sleep(1); // slight pause to simulate real users
}
