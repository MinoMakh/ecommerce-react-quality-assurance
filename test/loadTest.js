// E-commerce Performance and Load Testing with k6

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom metrics
const loginErrors = new Counter("login_errors");
const checkoutErrors = new Counter("checkout_errors");
const searchResponseTime = new Trend("search_response_time");
const addToCartSuccess = new Rate("add_to_cart_success_rate");

// Test configuration
export const options = {
  scenarios: {
    load_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 5 },
        { duration: "20s", target: 5 },
        { duration: "10s", target: 10 },
        { duration: "20s", target: 10 },
        { duration: "10s", target: 0 },
      ],
    },
    stress_test: {
      executor: "ramping-vus",
      startTime: "1m",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 20 },
        { duration: "20s", target: 20 },
        { duration: "10s", target: 40 },
        { duration: "20s", target: 40 },
        { duration: "10s", target: 0 },
      ],
    },
    spike_test: {
      executor: "ramping-vus",
      startTime: "2m30s",
      startVUs: 0,
      stages: [
        { duration: "5s", target: 50 },
        { duration: "10s", target: 50 },
        { duration: "5s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    search_response_time: ["p(90)<1000"],
    http_req_failed: ["rate<0.1"],
    login_errors: ["count<10"],
    checkout_errors: ["count<5"],
    http_reqs: ["rate>10"],
  },
};

// Test data
const testUsers = [{ username: "alice@example.com", password: "Firefly1122@" }];
const searchTerms = ["boots"];
const productIds = ["5X7SebHiDzAmEmRO9WZB"];

const BASE_URL = "http://localhost:59087";
const FIREBASE_API_KEY = "AIzaSyBubmPLIHiLbB6byL7C-boC5gPri6l6heM";

export default function () {
  // 1. Homepage
  let response = http.get(`${BASE_URL}`);
  console.log(response.status);
  check(response, {
    "homepage loads successfully": (r) => r.status === 200,
    "homepage loads under 2s": (r) => r.timings.duration < 2000,
  });
  sleep(1);

  // 2. Login
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  response = http.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    JSON.stringify({
      email: user.username,
      password: user.password,
      returnSecureToken: true,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const loginSuccess = check(response, {
    "login successful": (r) => r.status === 200,
    "login response time OK": (r) => r.timings.duration < 3000,
  });

  if (!loginSuccess) loginErrors.add(1);

  let authToken = "";
  if (response.status === 200) {
    try {
      authToken = response.json("idToken") || "";
    } catch (e) {
      console.log("Could not parse login response");
    }
  }

  sleep(1);

  // 3. Product Search
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const searchStart = Date.now();
  response = http.get(`${BASE_URL}/search/${searchTerm}`);
  const searchDuration = Date.now() - searchStart;
  searchResponseTime.add(searchDuration);

  check(response, {
    "search returns results": (r) => r.status === 200,
    "search has products": (r) => {
      try {
        const data = r.json();
        return data.products && data.products.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(2);

  // 4. Product Details View
  const productId = productIds[Math.floor(Math.random() * productIds.length)];
  response = http.get(`${BASE_URL}/product/${productId}`);
  check(response, {
    "product details load": (r) => r.status === 200,
    "product details fast": (r) => r.timings.duration < 1500,
  });

  sleep(3);

  // 5. Checkout
  if (authToken) {
    const headers = {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    };

    response = http.get(`${BASE_URL}/checkout/step1`, { headers });
    check(response, {
      "step 1 loads": (r) => r.status === 200,
      "step 1 fast": (r) => r.timings.duration < 1500,
    });
    sleep(1);

    response = http.get(`${BASE_URL}/checkout/step2`, { headers });
    check(response, {
      "step 2 loads": (r) => r.status === 200,
      "step 2 fast": (r) => r.timings.duration < 1500,
    });
    sleep(2);

    response = http.get(`${BASE_URL}/checkout/step3`, { headers });
    const step3OK = check(response, {
      "step 3 loads": (r) => r.status === 200,
      "step 3 fast": (r) => r.timings.duration < 1500,
    });

    if (!step3OK) checkoutErrors.add(1);
  }

  sleep(1);
}

export function teardown() {
  console.log("✅ Load test completed");
}
