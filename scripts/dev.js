import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting NovaCommerce Full-Stack Development Environment...');

// Start Backend on PORT 5000
const backend = spawn('node', ['api/index.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' },
});

// Start Frontend Vite
const frontend = spawn('npm', ['run', 'dev', '--prefix', 'client'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\n🛑 Shutting down dev servers...');
  backend.kill();
  frontend.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
