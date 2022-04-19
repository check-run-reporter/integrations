import {client} from '../lib/axios';
import {Context} from '../lib/types';

/**
 * Creates a (semi) mocked context for use in tests.
 */
export function makeTestContext(): Context {
  return {client, logger: console};
}
