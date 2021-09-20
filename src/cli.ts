import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

/**
 * Main entrypoint
 */
export function cli(argv: string[]) {
  yargs(hideBin(argv)).demandCommand().help().argv;
}

if (require.main === module) {
  cli(process.argv);
}
