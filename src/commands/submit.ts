import fs from 'fs';
import util from 'util';

import axios, {AxiosError} from 'axios';
import FormData from 'form-data';
import axiosRetry from 'axios-retry';

import {multiGlob} from '../lib/file';
import {Context} from '../lib/types';

axiosRetry(axios, {retries: 3});

type Optional<T> = T | undefined;

interface SubmitArgs {
  readonly label: Optional<string>;
  readonly report: readonly string[];
  readonly root: string;
  readonly sha: string;
  readonly token: string;
  readonly url: string;
}

/**
 * Submit report files to Check Run Reporter
 */
export async function submit(
  {label, report, root, sha, token, url}: SubmitArgs,
  context: Context
) {
  const {logger} = context;

  const files = await multiGlob(report, context);

  const formData = new FormData();
  for (const file of files) {
    formData.append('report', fs.createReadStream(file));
  }

  if (label) {
    formData.append('label', label);
  }
  formData.append('root', root);
  formData.append('sha', sha);

  logger.group('Uploading report to Check Run Reporter');
  try {
    logger.info(`Label: ${label}`);
    logger.info(`Root: ${root}`);
    logger.info(`SHA: ${sha}`);

    const response = await axios.post(url, formData, {
      auth: {password: token, username: 'token'},
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
    });

    logger.info(`Request ID: ${response.headers['x-request-id']}`);
    logger.info(`Status: ${response.status}`);
    logger.info(`StatusText: ${response.statusText}`);
    logger.info(JSON.stringify(response.data, null, 2));
  } catch (err) {
    if (!(err as AxiosError).isAxiosError) {
      throw err;
    }

    const axerr = err as AxiosError;

    if (!axerr.response) {
      // we didn't get a response, so rethrow before logging things that don't
      // exist.
      logger.error('Failed to make upload request');
      throw err;
    }

    logger.error(`Request ID: ${axerr.response.headers['x-request-id']}`);
    logger.error(util.inspect(axerr.response.data, {depth: 2}));

    throw err;
  } finally {
    logger.groupEnd();
  }
}
