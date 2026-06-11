import { relative, resolve, sep } from 'node:path';

const frontendRoot = resolve('frontend');

const toFrontendPaths = (files) =>
  files
    .map((file) => resolve(file))
    .filter((file) => file === frontendRoot || file.startsWith(`${frontendRoot}${sep}`))
    .map((file) => relative(frontendRoot, file).replaceAll(sep, '/'));

const quote = (value) => `"${value.replaceAll('"', '\\"')}"`;

const runFrontendTool = (toolName, toolArgs, files) => {
  const frontendFiles = toFrontendPaths(files);
  if (!frontendFiles.length) return [];

  return `node infra/scripts/run-frontend-tool.mjs ${toolName} ${toolArgs} ${frontendFiles
    .map(quote)
    .join(' ')}`;
};

export default {
  'frontend/**/*.{css,html,json,md,ts,tsx}': (files) =>
    runFrontendTool('prettier', '--write', files),
  'frontend/**/*.{ts,tsx}': (files) => runFrontendTool('eslint', '', files),
};
