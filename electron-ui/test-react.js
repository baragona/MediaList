const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Electron with React...');

const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');
const mainPath = path.join(__dirname, 'dist', 'main.js');

const env = Object.assign({}, process.env, { USE_REACT: '1' });

const electron = spawn(electronPath, [mainPath], {
  env: env,
  stdio: 'inherit'
});

electron.on('close', (code) => {
  console.log(`Electron process exited with code ${code}`);
});

// Keep script running
process.stdin.resume();