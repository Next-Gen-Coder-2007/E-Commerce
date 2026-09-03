/**
 * Universal Build Runner for Vercel Deployments
 * Automatically detects whether it is running from the root directory or inside client/
 */
import fs from 'fs';
import { execSync } from 'child_process';

console.log('[Build Runner] Determining build context...');

// Case 1: Running directly inside client/ directory
if (fs.existsSync('./vite.config.ts') || fs.existsSync('./vite.config.js')) {
  console.log('[Build Runner] Running inside client directory. Executing vite build...');
  try {
    execSync('npx vite build', { stdio: 'inherit' });
    console.log('[Build Runner] Client build succeeded.');
  } catch (err) {
    console.error('[Build Runner] Vite build failed:', err.message);
    process.exit(1);
  }
}
// Case 2: Running from root directory and client folder exists
else if (fs.existsSync('./client/package.json')) {
  console.log('[Build Runner] Running from root directory. Building client...');
  try {
    execSync('npm run build --prefix client', { stdio: 'inherit' });
    console.log('[Build Runner] Client build succeeded.');
  } catch (err) {
    console.warn('[Build Runner] Client build warning (continuing backend deployment):', err.message);
  }
}
// Case 3: Backend API only deployment
else {
  console.log('[Build Runner] Backend API deployment detected. Serverless functions are ready.');
}
