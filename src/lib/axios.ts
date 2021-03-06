import 'axios-debug-log';

import axiosRetry from 'axios-retry';
import axios, {AxiosInstance, AxiosResponse} from 'axios';
import ci from 'ci-info';

import pkg from '../../package.json';
import {BASEPATH, HOSTNAME} from '../constants';

const {version} = pkg;

/**
 * Creates a new http client with configuration
 */
export function makeClient({hostname}: {hostname?: string}): AxiosInstance {
  // Do not use ?? here in case hostname is an empty string
  hostname = hostname || HOSTNAME;
  const client = axios.create({
    baseURL: new URL(BASEPATH, `https://${hostname}`).toString(),
    headers: {
      'user-agent': [
        `crr/${version}`,
        ci.name,
        typeof ci.isPR === 'boolean' ? `(PR: ${ci.isPR})` : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
  });
  axiosRetry(client, {retries: 3});
  return client;
}

/**
 * extract the request id from the response object
 */
export function getRequestId(response: AxiosResponse) {
  return (
    response.headers['x-request-id'] || response.headers['x-amz-request-id']
  );
}
