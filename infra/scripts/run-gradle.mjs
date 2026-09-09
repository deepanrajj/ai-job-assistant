import { spawnSync } from 'node:child_process';

const [, , ...args] = process.argv;

if (args.length === 0) {
  console.error('Missing Gradle task name.');
  process.exit(1);
}

const backendDirectory = 'backend';

/**
 * cmd.exe takes a command line, not an argument array, so anything
 * holding a space or a cmd metacharacter has to carry its own quotes.
 * Node's `shell: true` does no escaping at all - it concatenates, which
 * is what DeprecationWarning DEP0190 is about - so `-Pmsg=hello world`
 * would arrive as two arguments. The quoting happens here instead.
 *
 * The empty string is quoted explicitly. The pattern below cannot match
 * it, so without the first clause an empty argument contributes nothing
 * to the joined command line and silently disappears, while the POSIX
 * branch passes it through as its own argv entry.
 *
 * One difference remains and cannot be fixed here: cmd expands `%NAME%`
 * inside arguments, including inside double quotes, so a value holding
 * `%TEMP%` arrives expanded on Windows and literal on POSIX. Avoiding
 * that means avoiding cmd, which is not possible while the launcher is
 * a `.bat` file.
 */
const quoteForCmd = (argument) =>
  argument === '' || /[\s"&|<>^()]/.test(argument)
    ? `"${argument.replace(/"/g, '\\"')}"`
    : argument;

/**
 * The launcher stays relative to `cwd` rather than being resolved to an
 * absolute path. An absolute path would reintroduce the same quoting
 * problem for every developer whose checkout sits under a directory with
 * a space in it, which on Windows includes any account named like
 * "John Smith".
 *
 * `/s` makes cmd strip only the outermost pair of quotes, leaving the
 * inner quoting intact, and `windowsVerbatimArguments` stops Node from
 * re-escaping the line built here.
 */
const runOnWindows = () => {
  const commandLine = ['.\\gradlew.bat', ...args.map(quoteForCmd)].join(' ');

  return spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `"${commandLine}"`], {
    cwd: backendDirectory,
    stdio: 'inherit',
    windowsVerbatimArguments: true,
  });
};

/**
 * No shell, so the argument array is passed through untouched and needs
 * no quoting. `./gradlew` resolves against `cwd`.
 */
const runOnPosix = () =>
  spawnSync('./gradlew', args, {
    cwd: backendDirectory,
    stdio: 'inherit',
  });

const result = process.platform === 'win32' ? runOnWindows() : runOnPosix();

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
