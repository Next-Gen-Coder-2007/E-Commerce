import fs from 'fs';
import { execSync } from 'child_process';

console.log('[Client Build Runner] Building client...');
execSync('npx vite build', { stdio: 'inherit' });
console.log('[Client Build Runner] Client build succeeded.');
