#!/usr/bin/env node

import yargs, {command} from 'yargs';
import {hideBin} from 'yargs/helpers';

import {submit} from './commands/submit';
import {logger} from './lib/logger';

/**
 * Main entrypoint
 */
export function cli(argv: string[]) {
  yargs(hideBin(argv))
    .command(
      'submit',
      'Submit report files to Check Run Reporter',
      (y) =>
        y.options({
          label: {
            description: 'Label that should appear in the GitHub check run.',
            type: 'string',
          },
          report: {
            demandOption: true,
            description:
              "Path or glob to the job's report files. May be specified multiple times.",
            type: 'array',
          },
          root: {
            default: process.cwd(),
            defaultDescription: 'the current working directory',
            description:
              'Prefix to remove from stack traces to annotated PRs correctly. Rarely needs to be changed from the default.',
            type: 'string',
          },
          sha: {
            demandOption: true,
            description: 'The commit being tested.',
            type: 'string',
          },
          token: {
            demandOption: true,
            description: 'Repo token with which to authenticate the upload.',
            type: 'string',
          },
          url: {
            default: 'https://api.check-run-reporter.com/api/v1/submissions',
            description:
              "Mostly here for future use, this let's us specify an alternate endpoint for testing new features. Unless specifically told to do so by support, please don't change this value.",
          },
        }),
      async ({report, ...args}) => {
        return submit(
          {
            ...args,
            report: report.filter(
              (r) => typeof r === 'string'
            ) as readonly string[],
          },
          {logger}
        );
      }
    )
    .demandCommand()
    .help().argv;
}

if (require.main === module) {
  cli(process.argv);
}
