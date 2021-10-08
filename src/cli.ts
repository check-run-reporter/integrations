#!/usr/bin/env node

import axios from 'axios';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

import {split} from './commands/split';
import {submit} from './commands/submit';
import {logger, silentLogger} from './lib/logger';

/**
 * Main entrypoint
 */
export function cli(argv: string[]) {
  yargs(hideBin(argv))
    .command(
      'split',
      'Split tests across multiple executors',
      (y) =>
        y.options({
          json: {
            default: false,
            description:
              'Output the entire response, even when piped or redirected',
            type: 'boolean',
          },
          label: {
            description: 'Label that should appear in the GitHub check run.',
            require: true,
            type: 'string',
          },
          nodeCount: {
            require: true,
            type: 'number',
          },
          nodeIndex: {
            require: true,
            type: 'number',
          },
          tests: {
            demandOption: true,
            description:
              "Path or glob to the job's test files. May be specified multiple times. Prefex a glob with a '!' to remove it's matches from the preceding set.",
            type: 'array',
          },
          token: {
            demandOption: true,
            description: 'Repo token with which to authenticate the upload.',
            type: 'string',
          },
          url: {
            default: 'https://api.check-run-reporter.com/api/v1/split',
            description:
              "Mostly here for future use, this let's us specify an alternate endpoint for testing new features. Unless specifically told to do so by support, please don't change this value.",
          },
        }),
      async ({tests, ...args}) => {
        const directlyUseOutput = !process.stdout.isTTY;
        try {
          const result = await split(
            {tests: tests.map(String), ...args},
            {logger: directlyUseOutput ? silentLogger : logger}
          );
          if (directlyUseOutput) {
            console.log(result.filenames.join('\n'));
          } else {
            console.log(JSON.stringify(result, null, 2));
          }
        } catch (err) {
          // we only need to log here if we'd been intended to directlyUseOutput
          // and therefore nothing else got logged.
          if (!directlyUseOutput) {
            throw err;
          }
          if (axios.isAxiosError(err)) {
            console.error(
              `Check Run Reporter return a ${err.response?.status}`
            );
            if (err.response?.data?.message?.details?.[0]?.message) {
              console.error(err.response.data.message.details[0].message);
            }
          }
          throw err;
        }
      }
    )
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
            report: report.map(String),
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
