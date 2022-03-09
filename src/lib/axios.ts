import axiosRetry from 'axios-retry';
import axios from 'axios';
import ci from 'ci-info';

import pkg from '../../package.json';

const {version} = pkg;

const prInfo = typeof ci.isPR === 'boolean' ? `(PR: ${ci.isPR})` : '';

export const client = axios.create({
  headers: {
    'user-agent': `crr/${version} ${ci.name} ${prInfo}`,
  },
});
axiosRetry(client, {retries: 3});
