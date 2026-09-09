import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const [, , ...args] = process.argv;

if (args.length === 0) {
  console.error('Missing Gradle task name.');
  process.exit(1);
}

// The Gradle wrapper ships two launchers. Windows needs the batch file;
// everywhere else uses the shell script, which is why this dispatch
// exists rather than hardcoding either one into package.json.
const launcherName = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const launcherPath = process.platform === 'win32' ? resolve('backend', launcherName) : launcherName;

const result = spawnSync(launcherPath, args, {
  cwd: 'backend',
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
