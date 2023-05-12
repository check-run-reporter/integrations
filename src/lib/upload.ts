import fs from 'fs';

import {PATH_MULTI_STEP_UPLOAD} from '../constants';

import {multiGlob} from './file';
import {Context, Optional} from './types';

interface UploadArgs {
  readonly label: Optional<string>;
  readonly report: readonly string[];
  readonly root: string;
  readonly sha: string;
  readonly token: string;
}

type URLs = Record<string, string>;

/**
 * Orchestrates the multi-step upload process.
 * @param args
 * @param context
 */
export async function multiStepUpload(args: UploadArgs, context: Context) {
  const {logger} = context;

  const {label, report, root, sha} = args;

  logger.info(`Label: ${label}`);
  logger.info(`Root: ${root}`);
  logger.info(`SHA: ${sha}`);

  const filenames = multiGlob(report, context);
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
  const {label, root, sha, token} = args;

  const response = await client.post(
    PATH_MULTI_STEP_UPLOAD,
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
  const {label, root, sha, token} = args;

  const response = await client.patch(
    PATH_MULTI_STEP_UPLOAD,
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
