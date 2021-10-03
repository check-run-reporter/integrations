import axios, {AxiosError} from 'axios';
import axiosRetry from 'axios-retry';

import {multiGlob} from '../lib/file';
import {Context} from '../lib/types';

axiosRetry(axios, {retries: 3});

interface SplitArgs {
  /** list of filenames or globs that match all available test files */
  readonly tests: readonly string[];
  readonly label: string;
  readonly nodeCount: number;
  readonly nodeIndex: number;
  readonly token: string;
  readonly url: string;
}

/**
 * Send the full list of available test files and get back the filees
 * appropriate to this node.
 */
export async function split(
  {tests, label, nodeCount, nodeIndex, token, url}: SplitArgs,
  context: Context
) {
  const filenames = await multiGlob(tests, context);

  const params = new URLSearchParams({
    label,
    nodeCount: String(nodeCount),
    nodeIndex: String(nodeIndex),
  });

  for (const filename of filenames) {
    params.append('filenames', filename);
  }

  const result = await axios.post(url, params, {
    auth: {password: token, username: 'token'},
  });

  return result.data;
}
