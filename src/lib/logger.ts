import ci from 'ci-info';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Some CI services include utility syntax for doing novel things with log
 * output. The Logger interfaces lets us do "the right thing" for those
 * services.
 */
export type Logger = Pick<Console, LogLevel | 'group' | 'groupEnd'>;

const mappings = {
  GITHUB_ACTIONS: {
    debug: 'debug',
    error: 'error',
    info: 'info',
    warn: 'warn',
  },
  default: {
    debug: 'debug',
    error: 'error',
    info: 'info',
    warn: 'warn',
  },
};

/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 * @see https://github.com/actions/toolkit/blob/ea81280a4d48fb0308d40f8f12ae00d117f8acb9/packages/core/src/utils.ts#L11-L18
 */
export function toCommandValue(input: unknown): string {
  if (input === null || input === undefined) {
    return '';
  } else if (typeof input === 'string' || input instanceof String) {
    return input as string;
  }
  return JSON.stringify(input);
}

/**
 * GitHub Action Helper
 * @see https://github.com/actions/toolkit/blob/ea81280a4d48fb0308d40f8f12ae00d117f8acb9/packages/core/src/command.ts#L80-L85
 */
function escapeData(s: unknown): string {
  return toCommandValue(s)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}

/** Generates a level logging function for the current CI service. */
function logFunctionFactory<L extends LogLevel>(level: L): Console[L] {
  if (ci.GITHUB_ACTIONS) {
    return (...args) =>
      console.log(
        `::${mappings.GITHUB_ACTIONS[level]}::${args
          .map((a) => escapeData(a))
          .join(', ')}`
      );
  }

  return (...args) => console[level](...args);
}

/** Generates a function for starting a log group for the current CI service. */
function groupFactory(): Console['group'] {
  if (ci.GITHUB_ACTIONS) {
    return (name: string) => console.log(`::group::${name}::`);
  }

  if (ci.BUILDKITE) {
    return (name: string) => console.log(`--- ${name}`);
  }

  return (...args) => console.group(...args);
}

/** Generates a function for ending a log group for the current CI service. */
function groupEndFactory(): Console['groupEnd'] {
  if (ci.GITHUB_ACTIONS) {
    return () => console.log(`::endgroup::`);
  }

  if (ci.BUILDKITE) {
    return () => undefined;
  }

  return (...args) => console.groupEnd(...args);
}

export const logger: Logger = {
  debug: logFunctionFactory('debug'),
  error: logFunctionFactory('error'),
  group: groupFactory(),
  groupEnd: groupEndFactory(),
  info: logFunctionFactory('info'),
  warn: logFunctionFactory('warn'),
};

const noop = () => null;
export const silentLogger: Logger = {
  debug: noop,
  error: noop,
  group: noop,
  groupEnd: noop,
  info: noop,
  warn: noop,
};
