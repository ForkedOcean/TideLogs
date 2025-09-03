/**
 * @name TideLogs API - Definitive Performance Test Suite
 * @description
 * This script represents a comprehensive, professional-grade performance test for the TideLogs API.
 * It simulates a realistic, mixed-workload environment and is designed for integration into
 * advanced performance engineering workflows.
 *
 * Scenarios Included:
 * 1. Ingestion: High-volume writes (`POST /logs`).
 * 2. Querying: Concurrent reads (`GET /logs`).
 * 3. Journey: A multi-step "write-then-read" user simulation.
 *
 * ---
 *
 * ADVANCED USAGE PATTERNS:
 *
 * 🔁 CI/CD Integration:
 * This script is CI/CD-ready. In your pipeline (GitHub Actions, GitLab CI), run a short
 * version of this test against a staging environment. The test will pass or fail based on the
 * 'thresholds' defined below. A failure will stop the build, preventing performance regressions.
 * `k6 run -d 5m ultimate-test.js`
 *
 * 📊 Real-Time Dashboarding:
 * Stream metrics to a time-series database for live visualization in Grafana. This is crucial
 * for observing performance during long tests and correlating data with server-side metrics.
 * `k6 run --out influxdb=http://localhost:8086/k6 ultimate-test.js`
 *
 * 💥 Chaos & Resilience Testing:
 * Run this script while simultaneously injecting failures into your system with tools like
 * Toxiproxy (e.g., add latency to the database connection). This script will measure how
 * gracefully your API handles and recovers from adverse conditions.
 *
 * 🔬 Server-Side Profiling:
 * While this script runs, use profiling tools on your server to find the root cause of bottlenecks.
 * - For the Rust App: Use `pprof-rs` or `flamegraph` to find hot spots in your code.
 * - For PostgreSQL: Use the `pg_stat_statements` extension to find slow or frequent queries.
 *
 * ---
 *
 * @example
 * // Default run (200 VUs, 10m)
 * k6 run definitive-test.js
 *
 * @example
 * // Quick smoke test (20 VUs, 1m)
 * VUS_TOTAL=20 DURATION=1m k6 run definitive-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';


// --- Custom Metrics ---
const IngestionTrend = new Trend('ingestion_response_time', true);
const QueryingTrend = new Trend('querying_response_time', true);
const JourneyTrend = new Trend('journey_duration', true);
const ErrorCounter = new Counter('error_count');


// --- Configuration ---
const VUS_TOTAL = __ENV.VUS_TOTAL || 200;
const DURATION = __ENV.DURATION || '10m';
const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:8080';

const INGESTION_TRAFFIC = parseFloat(__ENV.INGESTION_TRAFFIC) || 0.80;
const QUERYING_TRAFFIC = parseFloat(__ENV.QUERYING_TRAFFIC) || 0.15;

const VUS_INGESTION = Math.max(1, Math.floor(VUS_TOTAL * INGESTION_TRAFFIC));
const VUS_QUERYING = Math.max(1, Math.floor(VUS_TOTAL * QUERYING_TRAFFIC));
const VUS_JOURNEY = Math.max(1, VUS_TOTAL - VUS_INGESTION - VUS_QUERYING);

const SERVICES = ['payment-gateway', 'user-service', 'auth-api', 'notification-engine'];
const LOG_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'];


// --- Test Options ---
export const options = {
  scenarios: {
    ingestion: {
      executor: 'constant-vus', vus: VUS_INGESTION, duration: DURATION, exec: 'runIngestionTest',
    },
    querying: {
      executor: 'constant-vus', vus: VUS_QUERYING, duration: DURATION, exec: 'runQueryingTest', startTime: '5s',
    },
    journey: {
        executor: 'constant-vus', vus: VUS_JOURNEY, duration: DURATION, exec: 'runJourneyTest', startTime: '10s',
    },
  },
  thresholds: {
    'ingestion_response_time{status:200}': ['p(95)<800'],
    'querying_response_time{status:200}': ['p(95)<500'],
    'journey_duration{journey_step:full}': ['p(95)<1500'],
    'error_count': ['count<1000'],
    'checks': ['rate>0.99'],
  },
};

// --- Lifecycle Functions ---
export function setup() {
  console.log(`🚀 Starting test with ${VUS_TOTAL} total VUs for ${DURATION} against ${TARGET_URL}`);
  console.log(` -> Traffic Mix: ${VUS_INGESTION} Ingestion | ${VUS_QUERYING} Querying | ${VUS_JOURNEY} Journeys`);
}

// Use jslib to generate a more detailed end-of-test summary
export function handleSummary(data) {
    console.log('✅ Test finished.');
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}


// --- Scenarios ---
export function runIngestionTest() {
  const res = http.post(`${TARGET_URL}/logs`, generateRandomPayload(), { headers: { 'Content-Type': 'application/json' } });
  IngestionTrend.add(res.timings.duration, { status: res.status });
  const isSuccess = check(res, { 'POST /logs status is 200': (r) => r.status === 200 });
  if (!isSuccess) ErrorCounter.add(1);
  randomizedSleep(1, 5);
}

export function runQueryingTest() {
  const res = http.get(`${TARGET_URL}/logs?level=${getRandomItem(LOG_LEVELS)}&limit=25`);
  QueryingTrend.add(res.timings.duration, { status: res.status });
  const isSuccess = check(res, { 'GET /logs status is 200': (r) => r.status === 200 });
  if (!isSuccess) ErrorCounter.add(1);
  randomizedSleep(3, 10);
}

export function runJourneyTest() {
  const journeyStartTime = Date.now();
  group('Journey: Write then Read a Specific Log', function () {
    const uniqueService = `journey-service-${__VU}-${__ITER}`;
    const postRes = http.post(`${TARGET_URL}/logs`, JSON.stringify({ service: uniqueService, level: 'INFO', message: 'Journey log' }), { headers: { 'Content-Type': 'application/json' } });
    IngestionTrend.add(postRes.timings.duration, { status: postRes.status, journey_step: 'write' });
    const postSuccess = check(postRes, { 'Journey POST status is 200': (r) => r.status === 200 });
    if (!postSuccess) ErrorCounter.add(1);

    randomizedSleep(1, 2);

    if (postSuccess) {
      const getRes = http.get(`${TARGET_URL}/logs?service=${uniqueService}`);
      QueryingTrend.add(getRes.timings.duration, { status: getRes.status, journey_step: 'read' });
      const getSuccess = check(getRes, { 'Journey GET finds log': (r) => r.status === 200 && r.json('total') > 0 });
      if (!getSuccess) ErrorCounter.add(1);
    }
  });
  const journeyDuration = Date.now() - journeyStartTime;
  JourneyTrend.add(journeyDuration, { journey_step: 'full' });
  randomizedSleep(5, 15);
}

// --- Helper Functions ---
const generateRandomPayload = () => JSON.stringify({ service: getRandomItem(SERVICES), level: getRandomItem(LOG_LEVELS), message: `Log message for VU: ${__VU}, Iteration: ${__ITER}` });
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomizedSleep = (min, max) => sleep(Math.random() * (max - min) + min);