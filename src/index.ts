import * as os from 'os';
import * as yargs from 'yargs';
import {Application} from './application';

const argv = yargs
  .usage('$0 <filename>', 'Manage journal entries on command line', args => {
    return args.positional('filename', {
      describe: 'the filename containing the journal entries',
      type: 'string'
    })
  })
  .group(['from', 'to', 'on', 'last'], 'Filtering:')
    .describe('from', 'View entries on and after this date')
    .describe('to', 'View entries up to and on this date')
    .describe('on', 'View entries on this date')
    .describe('last', 'Show the last n entries matching the filter')
  .group('edit', 'Editing:')
    .describe('edit', 'Edit the entries matching the filter')
  .help('help')
  .argv;

const existingJournalArgs = [
  argv.from,
  argv.to,
  argv.on,
  argv.last,
  argv.edit
];

const application = new Application();

if (existingJournalArgs.every(value => !value)) {
  application.createJournalEntry(argv.filename);
}

//console.log(argv);