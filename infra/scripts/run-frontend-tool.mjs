import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const [, , toolName, ...args] = process.argv;
const supportedTools = new Set(['eslint', 'prettier']);

if (!toolName) {
  console.error('Missing frontend tool name.');
  process.exit(1);
}

if (!supportedTools.has(toolName)) {
  console.error(`Unsupported frontend tool: ${toolName}`);
  process.exit(1);
}

const binaryName = process.platform === 'win32' ? `${toolName}.cmd` : toolName;
const binaryPath = resolve('frontend', 'node_modules', '.bin', binaryName);

const result = spawnSync(binaryPath, args, {
  cwd: 'frontend',
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
