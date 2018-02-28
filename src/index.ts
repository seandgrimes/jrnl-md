import * as os from 'os';
import * as yargs from 'yargs';
import {Application} from './application';
import {container} from './inversify.config'
import {FilterParams} from './filter/filter-params';

const application = container.get<Application>(Application);

const argv = yargs
  .command(
    'create <journal>', 'Create a new journal entry', 
    (args) => {
      return args.positional('journal', {
        describe: 'The name of the journal to add the entry to',
        type: 'string'
      });
    },
    (args) => {
      application.createJournalEntry(args.journal);
    }
  )
  .command(
    'edit <journal>', 'Edit the journal entries that match the filter', 
    (args) => {
      return args.positional('journal', {
        describe: 'The name of the journal to edit entries from',
        type: 'string'
      });
    },
    (args) => {
      const filter = (args as any) as FilterParams; 
      application.editJournalEntries(filter);
    }
  )
  .command(
    'show <journal>', 'Show the journal entries that match the filter', 
    (args) => {
      return args.positional('journal', {
        describe: 'The name of the journal to show entries from',
        type: 'string'
      });
    },
    (args) => {
      const filter = (args as any) as FilterParams; 
      application.showJournalEntries(filter);
    }
  )
  .group(['from', 'to', 'on', 'last'], 'Filtering:')
    .describe('from', 'View entries on and after this date')
    .describe('to', 'View entries up to and on this date')
    .describe('on', 'View entries on this date')
    .describe('last', 'Show the last n entries matching the filter')
  .help()
  .argv;