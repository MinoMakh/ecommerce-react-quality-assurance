// E-commerce Performance and Load Testing with k6
// This test suite covers the critical user scenarios mentioned in your document

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom metrics for detailed analysis
const loginErrors = new Counter("login_errors");
const checkoutErrors = new Counter("checkout_errors");
const searchResponseTime = new Trend("search_response_time");
const addToCartSuccess = new Rate("add_to_cart_success_rate");

// Test configuration - following best practices from your document
export const options = {
  // Scenario-based testing with gradual ramp-up (avoiding artificial bottlenecks)
  scenarios: {
    // Load Testing: Normal expected load
    load_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 10 }, // Ramp up to 10 users
        { duration: "5m", target: 10 }, // Stay at 10 users
        { duration: "2m", target: 20 }, // Ramp up to 20 users
        { duration: "5m", target: 20 }, // Stay at 20 users
        { duration: "2m", target: 0 }, // Ramp down
      ],
    },

    // Stress Testing: Peak load conditions
    stress_test: {
      executor: "ramping-vus",
      startTime: "15m",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 50 }, // Ramp up to 50 users
        { duration: "5m", target: 50 }, // Stay at 50 users
        { duration: "2m", target: 100 }, // Ramp up to 100 users
        { duration: "5m", target: 100 }, // Stay at 100 users (stress level)
        { duration: "3m", target: 0 }, // Ramp down
      ],
    },

    // Spike Testing: Sudden traffic spikes
    spike_test: {
      executor: "ramping-vus",
      startTime: "32m",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 200 }, // Sudden spike
        { duration: "1m", target: 200 }, // Hold spike
        { duration: "30s", target: 0 }, // Quick ramp down
      ],
    },
  },

  // Performance thresholds based on your document's requirements
  thresholds: {
    // Response time requirements
    http_req_duration: ["p(95)<2000"], // 95% of requests under 2s
    search_response_time: ["p(90)<1000"], // Search under 1s (custom metric)

    // Throughput and success rates
    http_req_failed: ["rate<0.1"], // Error rate under 10%
    login_errors: ["count<10"], // Max 10 login errors
    checkout_errors: ["count<5"], // Max 5 checkout errors

    // Resource utilization (server-side monitoring needed)
    http_reqs: ["rate>50"], // Minimum 50 requests/second
  },
};

// Test data - parameterized to avoid same data issue mentioned in document
const testUsers = [{ username: "alice@example.com", password: "Alice123" }];

const searchTerms = ["boots"];
const productIds = [
  "5X7SebHiDzAmEmRO9WZB",
  "5X7SebHiDzAmEmRO9WZB",
  "5X7SebHiDzAmEmRO9WZB",
];

const BASE_URL = "http://192.168.1.110:3000";

export default function () {
  // Critical E-commerce User Journey Testing

  // 1. Homepage Load Test
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    "homepage loads successfully": (r) => r.status === 200,
    "homepage loads under 2s": (r) => r.timings.duration < 2000,
  });

  sleep(1); // Simulate user reading time

  // 2. User Registration/Login Test
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  const FIREBASE_API_KEY = "AIzaSyBubmPLIHiLbB6byL7C-boC5gPri6l6heM";

  response = http.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    JSON.stringify({
      email: user.username,
      password: user.password,
      returnSecureToken: true,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  const loginSuccess = check(response, {
    "login successful": (r) => r.status === 200,
    "login response time OK": (r) => r.timings.duration < 3000,
  });

  if (!loginSuccess) {
    loginErrors.add(1);
  }

  // Extract auth token if login successful
  let authToken = "";
  if (response.status === 200) {
    try {
      authToken = response.json("idToken") || "";
    } catch (e) {
      console.log("Could not parse login response");
    }
  }

  sleep(1);

  // 3. Product Search Test (parameterized)
  const searchTerm =
    searchTerms[Math.floor(Math.random() * searchTerms.length)];

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

  sleep(2); // User browsing time

  // 4. Product Details View
  const productId = productIds[Math.floor(Math.random() * productIds.length)];

  response = http.get(`${BASE_URL}/product/${productId}`);
  check(response, {
    "product details load": (r) => r.status === 200,
    "product details fast": (r) => r.timings.duration < 1500,
  });

  sleep(3); // User reading product details

  // 7. Multi-Step Checkout Process Test
  if (authToken) {
    const headers = {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    };

    // Step 1: Load checkout page step 1
    let response = http.get(`${BASE_URL}/checkout/step1`, { headers });
    check(response, {
      "step 1 loads": (r) => r.status === 200,
      "step 1 fast": (r) => r.timings.duration < 1500,
    });
    sleep(1); // simulate user delay

    // Step 2: Load checkout page step 2
    response = http.get(`${BASE_URL}/checkout/step2`, { headers });
    check(response, {
      "step 2 loads": (r) => r.status === 200,
      "step 2 fast": (r) => r.timings.duration < 1500,
    });
    sleep(2); // simulate user filling form

    // Step 3: Load final review page (final step)
    response = http.get(`${BASE_URL}/checkout/step3`, { headers });
    const step3OK = check(response, {
      "step 3 loads": (r) => r.status === 200,
      "step 3 fast": (r) => r.timings.duration < 1500,
    });

    if (!step3OK) {
      checkoutErrors.add(1);
    }
  }

  sleep(1);
}

// Teardown function for cleanup
export function teardown(data) {
  console.log("Load test completed");
}
