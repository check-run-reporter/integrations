# Check Run Reporter CI Integrations _(check-run-reporter/integrations)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Check Run Reporter's client library, CLI, and CI integrations.

This is a monorepo (sort of) for Check Run Reporter's client library, CLI, and
CI integrations. Instead of mainting separate test suites (if any tests at all)
for each plugin, this repo contains the core TypeScript code as well as CI
plugin integration code. As part of the build and release process, each plugin
is pushed to the appopropriate repository for consumption.

<!-- toc -->

-   [Install](#install)
-   [Usage](#usage)
    -   [Examples](#examples)
-   [Maintainers](#maintainers)
-   [Contributing](#contributing)
-   [License](#license)

<!-- tocstop -->

## Install

For the various CI integrations, check the READMEs in their
[respective repos](https://github.com/check-run-reporter).

For the CLI, download the
[latest releast](https://github.com/check-run-reporter/integrations/releases).
Binaries are available for Linux, macOS, and Windows.

## Usage

For the various CI integrations, check the READMEs in their
[respective repos](https://github.com/check-run-reporter).

For the CLI, get the most up to date documentation by running `crr --help`.

### Examples

#### Upload test reports produced by jest-junit

```sh
JEST_JUNIT_OUTPUT_DIR='reports/junit' \
JEST_JUNIT_ANCESTOR_SEPARATOR=' › ' \
JEST_JUNIT_CLASSNAME='{classname}' \
JEST_JUNIT_INCLUDE_CONSOLE_OUTPUT=true \
JEST_JUNIT_OUTPUT_NAME='jest.xml' \
JEST_JUNIT_SUITE_NAME='Some Label' \
JEST_JUNIT_TITLE='{title}' \
jest --ci --reporters=jest-junit

crr submit \
  --label='Some Label' \
  --report='reports/junit/**/*.xml' \
  --token='<your token>' \
  --sha="$(git rev-parse HEAD)"
```

#### Distribute tests across multiple test runners

If you're on the Persistent plan, you can use Check Run Reporter to efficiently
distribute your tests across multiple test runners.

`crr split` prints the names of all of the test files that should be run by this
node. Specify the `--nodeCount` and `--nodeIndex` options to to tell Check Run
Reporter how many nodes there are and which node this is. Use the `--tests`
option to identify all candidate test files. Any tests that Check Run Reporter
has seen before will be evenly distributed while new test will be spread
round-robin.

```sh
npx jest $(crr split \
  --label='Unit Tests' \
  --nodeCount=3 \
  --nodeIndex=1 \
  --tests='src/**/*.spec.ts' \
  --token=$CHECK_RUN_REPORTER_TOKEN)
```

## Maintainers

[Ian Remmel](https://github.com/ianwremmel)

## Contributing

We welcome pull requests, but for anything more than a minor tweak, please
create an issue for so we can discuss whether the change is the right direction
for the project.

## License

[MIT](LICENSE) &copy; Ian Remmel, LLC 2019-2021
