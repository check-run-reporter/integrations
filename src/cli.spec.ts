import assert from 'node:assert';

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
  // This is a hack to deal with CI having a differing executable name for some.
  // CI used to work just fine (a main branch build fully passed tests), but now
  // an unchanged branch off of main using a different process name.
  stderr.mock.calls.forEach((call) => {
    assert(Array.isArray(call));
    call.forEach((c, index) => {
      assert(typeof c === 'string');
      call[index] = c.replace(/processChild.js/g, 'jest');
    });
  });

  expect(stdout.mock.calls).toMatchInlineSnapshot(`[]`);
  expect(stderr.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "jest <command>

    Commands:
      jest split   Split tests across multiple executors
      jest submit  Submit report files to Check Run Reporter

    Options:
      --version  Show version number                                       [boolean]
      --help     Show help                                                 [boolean]",
      ],
      [],
      [
        "Not enough non-option arguments: got 0, need at least 1",
      ],
    ]
  `);
  expect(exit).toBeCalledWith(1);
});

it('prints the version and exits', () => {
  cli(['', '', '--version']);
  expect(stdout.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "0.0.0-development",
      ],
    ]
  `);
  expect(stderr.mock.calls).toMatchInlineSnapshot(`[]`);
  expect(exit).toBeCalledWith(0);
});
