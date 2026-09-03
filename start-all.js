/**
 * NovaCommerce Unified Production Backend Launcher (All-in-One Process)
 *
 * Designed for hosting platforms (Render, Railway, Fly.io, Heroku, single VPS/Docker container)
 * where running all microservices and the API Gateway in one unified instance is desired.
 *
 * - API Gateway binds to process.env.PORT (or 5000) for incoming web traffic.
 * - Microservices bind to internal ports (5001 - 5007).
 * - Inter-process logs are color-coded and multiplexed.
 * - Handles graceful SIGINT and SIGTERM termination.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const nodeCmd = process.execPath || 'node';

const services = [
  { name: 'auth-service', script: path.join(__dirname, 'services', 'auth-service', 'server.js'), env: { PORT: 5001 } },
  { name: 'product-service', script: path.join(__dirname, 'services', 'product-service', 'server.js'), env: { PORT: 5002 } },
  { name: 'cart-service', script: path.join(__dirname, 'services', 'cart-service', 'server.js'), env: { PORT: 5003 } },
  { name: 'order-service', script: path.join(__dirname, 'services', 'order-service', 'server.js'), env: { PORT: 5004 } },
  { name: 'payment-service', script: path.join(__dirname, 'services', 'payment-service', 'server.js'), env: { PORT: 5005 } },
  { name: 'wishlist-service', script: path.join(__dirname, 'services', 'wishlist-service', 'server.js'), env: { PORT: 5006 } },
  { name: 'inventory-service', script: path.join(__dirname, 'services', 'inventory-service', 'server.js'), env: { PORT: 5007 } },
  { name: 'notification-worker', script: path.join(__dirname, 'services', 'notification-worker', 'worker.js'), env: {} },
  { name: 'api-gateway', script: path.join(__dirname, 'gateway', 'server.js'), env: { PORT: process.env.PORT || 5000 } },
];

const children = [];

const colors = {
  'auth-service': '\x1b[34m', // blue
  'product-service': '\x1b[32m', // green
  'cart-service': '\x1b[36m', // cyan
  'order-service': '\x1b[33m', // yellow
  'payment-service': '\x1b[35m', // magenta
  'wishlist-service': '\x1b[95m', // light magenta
  'inventory-service': '\x1b[92m', // light green
  'notification-worker': '\x1b[90m', // gray
  'api-gateway': '\x1b[31m', // red
  reset: '\x1b[0m',
};

console.log('\x1b[1m\x1b[32m%s\x1b[0m', '=====================================================');
console.log('\x1b[1m\x1b[32m%s\x1b[0m', '  NovaCommerce Unified Production Cluster Launching  ');
console.log('\x1b[1m\x1b[32m%s\x1b[0m', '=====================================================');
console.log(`[Host OS] ${process.platform} (${process.arch})`);
console.log(`[Target Public Gateway Port] ${process.env.PORT || 5000}`);
console.log(`[Internal Services] 7 microservices + 1 worker\n`);

services.forEach((svc) => {
  const color = colors[svc.name] || colors.reset;
  const childEnv = { ...process.env, ...svc.env };

  const child = spawn(nodeCmd, [svc.script], {
    env: childEnv,
    cwd: path.dirname(svc.script),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${svc.name}]${colors.reset} ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${color}[${svc.name}:ERR]${colors.reset} ${line}`);
      }
    });
  });

  child.on('exit', (code, signal) => {
    console.warn(
      `${color}[${svc.name}]${colors.reset} Process exited with code ${code} (signal: ${signal})`
    );
  });

  children.push({ name: svc.name, process: child });
});

// Graceful Shutdown
const shutdown = (signal) => {
  console.log(`\n[Cluster Manager] Received ${signal}. Gracefully stopping all microservices...`);
  children.forEach(({ name, process: child }) => {
    try {
      if (isWindows) {
        child.kill();
      } else {
        child.kill('SIGTERM');
      }
    } catch (err) {
      console.error(`Failed to stop ${name}:`, err.message);
    }
  });

  setTimeout(() => {
    console.log('[Cluster Manager] All processes terminated. Goodbye.');
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
