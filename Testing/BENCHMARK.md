# k6 + Grafana Benchmark Runbook

## 1) Start the app stack

From the repo root:

```bash
docker compose up -d --build backend-1 backend-2 frontend nginx nginx-exporter redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5 redis-node-6 redis-node-7 redis-node-8 redis-cluster-init zookeeper kafka signup-worker email-consumer inventory-consumer prometheus grafana
```

## 2) Wait for the services

- API through Nginx: `http://localhost`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

Grafana login:
- user: `admin`
- password: `admin`

## 3) Point Grafana at Prometheus

The datasource is provisioned automatically from:

- `Monitor/grafana/provisioning/datasources/prometheus.yml`

If you want to verify it manually, use:

- URL: `http://prometheus:9090`

## 4) Run a k6 benchmark

Run a public-read benchmark through Nginx:

```bash
docker compose --profile bench run --rm -e SCENARIO=products_public k6
```

Other scenarios:

- `health`
- `stats_public`
- `login`
- `signup` (creates a new unverified account on every iteration and queues an OTP email; start at a low rate)
- `cart_read`
- `add_to_cart`
- `update_cart`
- `place_order`

Example for an authenticated route:

```bash
docker compose --profile bench run --rm ^
  -e SCENARIO=place_order ^
  -e AUTH_TOKEN="Bearer <your-token>" ^
  k6
```

Useful overrides:

- `TARGET_URL=http://nginx`
- `RATE=200` (target iterations / requests per second)
- `DURATION=60s`
- `PREALLOCATED_VUS=300`
- `MAX_VUS=500`
- `PRODUCT_ID=<uuid>`
- `CART_ITEM_ID=<uuid>`
- `EMAIL=<email>`
- `PASSWORD=<password>`
- `SIGNUP_EMAIL_DOMAIN=example.test`

Signup targets 200 requests per second by default. Each successful request creates a permanent database user and queues an OTP email. Signup testing stops after the registration response; it does not call `/api/verify-otp`:

```powershell
docker compose --profile bench run --rm -e SCENARIO=signup -e RATE=200 -e DURATION=30s k6
```

For a signup throughput run with password hashing and OTP queueing disabled, use the test-only Compose override and a separate disposable database. The override requires `LOAD_TEST_DATABASE_URL`; do not point it at the normal application database. In PowerShell:

```powershell
$env:LOAD_TEST_DATABASE_URL = '<connection-string-for-a-separate-test-database>'
$env:DATABASE_URL = $env:LOAD_TEST_DATABASE_URL
Push-Location Backend
npx prisma migrate deploy
Pop-Location
docker compose -f docker-compose.yml -f docker-compose.loadtest.yml --profile bench up -d --build backend-1 backend-2 backend-3 backend-4 nginx prometheus
docker compose -f docker-compose.yml -f docker-compose.loadtest.yml --profile bench run --rm --no-deps k6
```

Load-test accounts use a placeholder password value and cannot sign in. They remain unverified. Remove the generated `k6-*@example.test` rows from the disposable database after the run if you want to reset it.
After the benchmark, restart the API in normal mode by running `docker compose up -d --force-recreate backend-1 backend-2 backend-3 backend-4 nginx` without the load-test override.

## 5) What to watch in Grafana

Use Prometheus queries like:

- Requests per second:
  `sum(rate(http_requests_total[1m]))`
- Error rate:
  `sum(rate(http_requests_total{status=~"4..|5.."}[1m])) / sum(rate(http_requests_total[1m]))`
- P95 latency:
  `histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le, route))`

The backend metrics are exposed at:

- `http://localhost:5000/metrics`
- `http://localhost:5001/metrics`
