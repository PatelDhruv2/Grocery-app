import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 1500 },  // ramp up
    { duration: '30s', target: 1500 },  // steady
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
    email: `user111${userId}@example.com`,
    password: 'Password123',
    phone:"1234567890",
    name: `User${userId}`,
    address: `Address ${userId}`,
    
  });

  const headers = { 'Content-Type': 'application/json' };

  const res = http.post(`${BASE_URL}/userRegister`, payload, { headers });

  check(res, { 'Login successful': (r) => r.status === 200 });

  sleep(1); // slight pause to simulate real users
}
