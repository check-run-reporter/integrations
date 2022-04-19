import fs from 'fs';

import FormData from 'form-data';

import {getRequestId} from './axios';
import {multiGlob} from './file';
import {Context, Optional} from './types';

interface UploadArgs {
  readonly label: Optional<string>;
  readonly report: readonly string[];
  readonly root: string;
  readonly sha: string;
  readonly token: string;
  readonly url: string;
}

type URLs = Record<string, string>;
/**
 * Uploads directly to Check Run Reporter. This is a legacy solution that no
 * longer works for large submissions thanks to new backend architecture. It
 * remains for compatibility reasons during the transition period, but multstep
 * is the preferred method going forward.
 * @deprecated use multiStepUpload instead
 */
export async function singleStepUpload(
  {label, report, root, sha, token, url}: UploadArgs,
  context: Context
) {
  const {client, logger} = context;

  logger.info(`Label: ${label}`);
  logger.info(`Root: ${root}`);
  logger.info(`SHA: ${sha}`);
  logger.debug(`URL: ${url}`);

  const filenames = await multiGlob(report, context);

  const formData = new FormData();
  for (const filename of filenames) {
    formData.append('report', fs.createReadStream(filename));
  }

  if (label) {
    formData.append('label', label);
  }
  formData.append('root', root);
  formData.append('sha', sha);

  const response = await client.post(url, formData, {
    auth: {password: token, username: 'token'},
    headers: {
      ...formData.getHeaders(),
    },
    maxContentLength: Infinity,
  });

  logger.info(`Request ID: ${getRequestId(response)}`);
  logger.info(`Status: ${response.status}`);
  logger.info(`StatusText: ${response.statusText}`);
  logger.info(JSON.stringify(response.data, null, 2));

  return response;
}

/**
 * Orchestrates the multi-step upload process.
 * @param args
 * @param context
 */
export async function multiStepUpload(args: UploadArgs, context: Context) {
  const {logger} = context;

  const {label, report, root, sha, url} = args;

  logger.info(`Label: ${label}`);
  logger.info(`Root: ${root}`);
  logger.info(`SHA: ${sha}`);
  logger.debug(`URL: ${url}/upload`);

  const filenames = await multiGlob(report, context);
  logger.group('Requesting signed urls');
  const {keys, urls, signature} = await getSignedUploadUrls(
    args,
    filenames,
    context
  );
  logger.groupEnd();

  logger.group('Uploading reports');
  await uploadToSignedUrls(filenames, urls, context);
  logger.groupEnd();

  logger.group('Finalizing upload');
  await finishMultistepUpload(args, keys, signature, context);
  logger.groupEnd();
}

/** Fetches signed URLs */
export async function getSignedUploadUrls(
  args: UploadArgs,
  filenames: readonly string[],
  {client}: Context
): Promise<{keys: string[]; signature: string; urls: Record<string, string>}> {
  const {label, root, sha, token, url} = args;

  const response = await client.post(
    `${url}/upload`,
    {filenames, label, root, sha},
    {
      auth: {password: token, username: 'token'},
      maxContentLength: Infinity,
      timeout: 30000,
    }
  );

  return response.data;
}

/** Uploads directly to S3. */
export async function uploadToSignedUrls(
  filenames: readonly string[],
  urls: URLs,
  {client}: Context
) {
  for (const filename of filenames) {
    const stream = fs.createReadStream(filename);
    await client.put(urls[filename], stream, {
      headers: {
        'Content-Length': String((await fs.promises.stat(filename)).size),
      },
    });
  }
}

/**
 * Informs Check Run Reporter that all files have been uploaded and that
 * processing may begin.
 */
export async function finishMultistepUpload(
  args: UploadArgs,
  keys: readonly string[],
  signature: string,
  {client}: Context
) {
  const {label, root, sha, token, url} = args;

  const response = await client.patch(
    `${url}/upload`,
    {
      keys,
      label,
      root,
      sha,
      signature,
    },
    {
      auth: {password: token, username: 'token'},
      maxContentLength: Infinity,
    }
  );

  return response;
}
