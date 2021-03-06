import {cli} from './cli';

/* eslint-disable @typescript-eslint/no-empty-function */
/** noop */
function noop() {}
/* eslint-enable @typescript-eslint/no-empty-function */

let exit: jest.SpyInstance<ReturnType<NodeJS.Process['exit']>>,
  stdout: jest.SpyInstance<ReturnType<Console['log']>>,
  stderr: jest.SpyInstance<ReturnType<Console['error']>>;

beforeEach(() => {
  // @ts-expect-error
  exit = jest.spyOn(process, 'exit').mockImplementation(noop);
  stdout = jest.spyOn(console, 'log');
  stderr = jest.spyOn(console, 'error');
});

it('prints help and exits', () => {
  cli(['', '']);
  expect(stdout.mock.calls).toMatchInlineSnapshot(`Array []`);
  expect(stderr.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "jest <command>

Commands:
  jest split   Split tests across multiple executors
  jest submit  Submit report files to Check Run Reporter

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]",
  ],
  Array [],
  Array [
    "Not enough non-option arguments: got 0, need at least 1",
  ],
]
`);
  expect(exit).toBeCalledWith(1);
});

it('prints the version and exits', () => {
  cli(['', '', '--version']);
  expect(stdout.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "0.0.0-development",
  ],
]
`);
  expect(stderr.mock.calls).toMatchInlineSnapshot(`Array []`);
  expect(exit).toBeCalledWith(0);
});
