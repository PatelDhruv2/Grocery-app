import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.TARGET_URL || "http://nginx").replace(/\/$/, "");
const scenario = (__ENV.SCENARIO || "products_public").toLowerCase();
const vus = Number(__ENV.VUS || 25);
const duration = __ENV.DURATION || "30s";
const token = __ENV.AUTH_TOKEN || "";
const productId = __ENV.PRODUCT_ID || "";
const cartItemId = __ENV.CART_ITEM_ID || "";
const quantity = Number(__ENV.QUANTITY || 1);
const email = __ENV.EMAIL || "demo@example.com";
const password = __ENV.PASSWORD || "Password123!";

export const options = {
  vus,
  duration,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

function jsonHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    ...extra,
  };
}

function authedHeaders() {
  return token
    ? jsonHeaders({ Authorization: token })
    : jsonHeaders();
}

function get(path) {
  return http.get(`${baseUrl}${path}`);
}

function post(path, body, headers = jsonHeaders()) {
  return http.post(`${baseUrl}${path}`, JSON.stringify(body), { headers });
}

function put(path, body, headers = jsonHeaders()) {
  return http.put(`${baseUrl}${path}`, JSON.stringify(body), { headers });
}

function runHealth() {
  const res = get("/");
  check(res, { "health ok": (r) => r.status === 200 });
}

function runProductsPublic() {
  const res = get("/products/productimage");
  check(res, { "products ok": (r) => r.status === 200 });
}

function runStatsPublic() {
  const res = get("/stats/totalproducts");
  check(res, { "stats ok": (r) => r.status === 200 });
}

function runLogin() {
  const res = post("/api/userLogin", { email, password }, jsonHeaders());
  check(res, { "login status valid": (r) => r.status === 200 || r.status === 403 });
}

function runCartRead() {
  const res = get("/products/cartitems", authedHeaders());
  check(res, { "cart read ok": (r) => r.status === 200 || r.status === 404 });
}

function runAddToCart() {
  const res = post(
    "/products/addtocart",
    { productId, quantity },
    authedHeaders()
  );
  check(res, { "add to cart ok": (r) => r.status === 200 });
}

function runUpdateCartItem() {
  const res = put(
    `/products/updatecartitem/${cartItemId}`,
    { quantity },
    authedHeaders()
  );
  check(res, { "update cart ok": (r) => r.status === 200 });
}

function runPlaceOrder() {
  const res = post("/products/placeorder", {}, authedHeaders());
  check(res, { "place order ok": (r) => r.status === 200 || r.status === 400 });
}

export default function () {
  switch (scenario) {
    case "health":
      runHealth();
      break;
    case "stats_public":
      runStatsPublic();
      break;
    case "login":
      runLogin();
      break;
    case "cart_read":
      runCartRead();
      break;
    case "add_to_cart":
      runAddToCart();
      break;
    case "update_cart":
      runUpdateCartItem();
      break;
    case "place_order":
      runPlaceOrder();
      break;
    case "products_public":
    default:
      runProductsPublic();
      break;
  }

  sleep(1);
}
