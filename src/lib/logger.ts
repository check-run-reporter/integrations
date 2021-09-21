/**
 * Some CI services incldue utility syntax for doing novel things with log
 * output. The Logger interfaces lets us do "the right thing" for those
 * services.
 */
export type Logger = Pick<
  Console,
  'debug' | 'info' | 'warn' | 'error' | 'group' | 'groupEnd'
>;

/**
 * For now, logger is just `console`, but it'll evolve to using folding comments
 * for Buildkite, GitHub's builtin logger, and so forth
 */
export const logger = console;
