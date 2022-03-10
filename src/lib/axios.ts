import axiosRetry from 'axios-retry';
import axios, {AxiosResponse} from 'axios';
import ci from 'ci-info';

import pkg from '../../package.json';

const {version} = pkg;

export const client = axios.create({
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

/**
 * extract the request id from the response object
 */
export function getRequestId(response: AxiosResponse) {
  return (
    response.headers['x-request-id'] || response.headers['x-amz-request-id']
  );
}
