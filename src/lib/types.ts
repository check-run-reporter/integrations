import {Logger} from './logger';

export interface Context {
  readonly logger: Logger;
}

export type Optional<T> = T | undefined;
