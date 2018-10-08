import * as moment from 'moment';
import * as process from 'process';
import {injectable} from 'inversify';
import {spawn} from 'child_process';
import {Entry} from '../storage/entry';
import { JournalTempFile } from './journal-temp-file';
import { ConfigService } from '../config/config-service';
import { DATE_FORMAT } from '../constants';

/**
 * Editor service for interacting with the user's
 * default text editor to create and edit existing
 * journal entries
*/
@injectable()
export class EditorService {
  /**
   * Constructor
  */
  constructor(private configService: ConfigService) {
  }

  /**
   * Opens the user's default editor to create a new journal entry and then
   * converts the temp file to a new journal entry once the editor closes
   *
   * @returns A promise containing the new journal entry or null when it is resolved
  */
  createJournalEntry() : Promise<Entry> {
    const tempFile = new JournalTempFile();
    const entry: Entry = {
      date: moment().format(DATE_FORMAT),
      body: ''
    };

    return this.spawnEditor(tempFile, entry, true);
  }

  /**
   * Opens the user's default editor to edit an existing journal entry and then
   * converts the temp file to a new journal entry once the editor closes
   *
   * @returns A promise containing the new journal entry or null when it is resolved
  */
  editJournalEntry(entry: Entry) : Promise<Entry> {
    const tempFile = new JournalTempFile();
    return this.spawnEditor(tempFile, entry, false);
  }

  /**
   * Opens the specified temp file in the user's default editor
   *
   * @param tempFile The temp file to open in the user's editor
   * @param entry The entry to edit, can be a new or existing entry
   * @param isNewEntry Whether or not this is a new or existing entry
   * @returns A promise with the parsed Entry from the temp file
   */
  private async spawnEditor(tempFile: JournalTempFile, entry: Entry, isNewEntry: boolean) : Promise<Entry> {
    const openEditor = async () => {
      const config = await this.configService.getOrCreateConfigFile();
      const editor = config.editor || process.env.EDITOR;
      const editorParts = editor.split(' ').filter(entry => entry.trim() !== '');
      const editorCmd = editorParts.shift();
      const args = editorParts || [];

      return new Promise<void>((resolve, reject) => {
        args.push(tempFile.filename);
        const editor = spawn(editorCmd, args);
        editor.on('close', (code) => {
          code !== 0
            ? reject(`Editor exited with code ${code}`)
            : resolve();
        });
      });
    }

    return tempFile.write(entry, isNewEntry)
      .then(() => openEditor())
      .then(() => tempFile.read());
  }
}
