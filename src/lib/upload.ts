import fs from 'fs';

import FormData from 'form-data';

import {client} from './axios';
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
  return response;
}
