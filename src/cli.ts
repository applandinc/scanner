#!/usr/bin/env node

import yargs from 'yargs';
import LoginCommand from './cli/login/command';
import WhomaiCommand from './cli/whoami/command';
import CICommand from './cli/ci/command';
import UploadCommand from './cli/upload/command';
import ScanCommand from './cli/scan/command';

yargs(process.argv.slice(2))
  .option('verbose', {
    describe: 'Show verbose output',
    alias: 'v',
  })
  .command(LoginCommand)
  .command(WhomaiCommand)
  .command(ScanCommand)
  .command(UploadCommand)
  .command(CICommand)
  .fail((msg, err, yargs) => {
    if (msg) {
      console.log(yargs.help());
      console.log(msg);
    } else if (err) {
      console.error(err);
    }
    process.exit(1);
  })
  .strict()
  .demandCommand()
  .help().argv;
