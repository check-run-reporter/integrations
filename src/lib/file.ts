import glob from 'glob';
import {difference, union} from 'lodash';

import {Context} from './types';

/**
 * Wrapper around glob.sync mostly inspired by grunt.file.expand
 *
 * @param patterns - array of globs. In order to support CI systems that make
 * array inputs difficult, each pattern will be split into separate pattern if
 * it contains a semicolon.
 * @returns
 */
export function multiGlob(
  patterns: readonly string[],
  {logger}: Context
): readonly string[] {
  logger.group(`Locating files`);

  // Iterate over flattened patterns array.
  const results = patterns
    .flatMap((p) => p.split(';'))
    .reduce((result, pattern) => {
      // If the first character is ! it should be omitted
      const exclusion = pattern.indexOf('!') === 0;

      logger.group(
        `Locating files ${exclusion ? 'not ' : ''}matching ${pattern}`
      );

      // If the pattern is an exclusion, remove the !
      if (exclusion) {
        pattern = pattern.slice(1);
      }
      // Find all matching files for this pattern.
      const matches = glob.sync(pattern);
      if (matches.length === 0) {
        logger.warn(`Could not find any files matching glob ${pattern}`);
      }
      if (exclusion) {
        // If an exclusion, remove matching files.
        result = difference(result, matches);
      } else {
        // Otherwise add matching files.
        result = union(result, matches);
      }
      logger.groupEnd();
      return result;
    }, [] as string[]);

  logger.info(`found ${results.length} reports`);

  logger.groupEnd();

  return results;
}
