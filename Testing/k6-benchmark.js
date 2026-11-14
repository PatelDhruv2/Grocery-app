import http from "k6/http";
import { check } from "k6";

const baseUrl = (__ENV.TARGET_URL || "http://nginx").replace(/\/$/, "");
const scenario = (__ENV.SCENARIO || "products_public").toLowerCase();
const rate = Number(__ENV.RATE || 200);
const duration = __ENV.DURATION || "30s";
const preAllocatedVUs = Number(__ENV.PREALLOCATED_VUS || 300);
const maxVUs = Number(__ENV.MAX_VUS || 500);
const token = __ENV.AUTH_TOKEN || "";
const productId = __ENV.PRODUCT_ID || "";
const cartItemId = __ENV.CART_ITEM_ID || "";
const quantity = Number(__ENV.QUANTITY || 1);
const email = __ENV.EMAIL || "demo@example.com";
const password = __ENV.PASSWORD || "Password123!";
const signupEmailDomain = __ENV.SIGNUP_EMAIL_DOMAIN || "example.test";

export const options = {
  scenarios: {
    products_load: {
      executor: "constant-arrival-rate",
      rate,
      timeUnit: "1s",
      duration,
      preAllocatedVUs,
      maxVUs,
    },
  },
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

function runSignup() {
  const uniqueEmail = `k6-${Date.now()}-${__VU}-${__ITER}@${signupEmailDomain}`;
  const payload = {
    name: `k6 test user ${__VU}-${__ITER}`,
    email: uniqueEmail,
    password: __ENV.SIGNUP_PASSWORD || "K6-Test-Password-123!",
    phone: `9${String(__VU).padStart(2, "0")}${String(__ITER).padStart(7, "0")}`,
    address: `k6 load test address ${__VU}-${__ITER}`,
  };

  const res = post("/api/userRegister", payload);
  check(res, {
    "signup created unverified account": (r) => r.status === 201,
  });
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
    case "signup":
      runSignup();
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

}
