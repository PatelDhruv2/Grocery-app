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
- `VUS=50`
- `DURATION=60s`
- `PRODUCT_ID=<uuid>`
- `CART_ITEM_ID=<uuid>`
- `EMAIL=<email>`
- `PASSWORD=<password>`

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
