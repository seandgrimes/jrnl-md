import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as marked from 'marked';
import * as TerminalRenderer from 'marked-terminal';
import "reflect-metadata";
import {injectable} from 'inversify';
import {EditorService} from './editor/editor-service';
import {Entry} from './storage/entry';
import {FilterParams} from './filter/filter-params';
import {FilterService} from './filter/filter-service';
import { Journal } from './storage/journal';
import { ConfigService } from './config/config-service';

/**
 * Represents our application logic, this class is what the
 * CLI interacts with to accomplish whatever the user is
 * requesting
*/
@injectable()
export class Application {
  private appDir: string;

  /**
   * Constructor
   *
   * @param editorService The EditorService implementation to use
   * @param filterService The FilterService implementation to use
  */
  constructor(
      private editorService:EditorService,
      private filterService:FilterService,
      private configService:ConfigService) {

    this.appDir = configService.getStoragePath();
    this.initialize();
  }

  /**
   * Create a new journal entry using the user's default
   * editor and then save the newly created journal entry
   * to the journal file.
   *
   * @param journalName The name of the journal to create an entry for
   */
  async createJournalEntry(journalName: string) {
    let journal: Journal = null;
    const journalPath = this.getFileName(journalName);

    try {
      journal = await Journal.load(journalPath);
    } catch (ex) {
      console.log(`Error opening journal file: ${ex}`);
      console.log(ex.stack);
    }

    try {
      const newEntry = await this.editorService.createJournalEntry();
      if (newEntry) {
        journal.addEntry(newEntry);
        await journal.save();
      }
    }
    catch (ex) {
      console.log(`Error creating journal entry: ${ex}`);
      console.log(ex.stack);
    }
  }

  /**
   * Edit the journal entries that match the supplied filter, opening
   * them in the user's default editor one at a time
   *
   * @param filter The filter to use to determine which journal entries to edit
   */
  async editJournalEntries(filter: FilterParams) {
    let filename = this.getFileName(filter.journal);
    let journal = await Journal.load(filename);
    let filtered = this.filterService.filter(journal, filter);

    for (var entry of filtered) {
      const updated = await this.editorService.editJournalEntry(entry);
      Object.assign(entry, updated);
    }

    await journal.save();
  }

  /**
   * Gets the filename for the provided journal
   *
   * @param journal The journal to return the filename of
   * @returns The filename of the journal
   */
  private getFileName(journal: string) : string {
    journal = !journal.endsWith('.json')
      ? journal + '.json'
      : journal;

    return path.join(this.appDir, journal);
  }

  /**
   * Takes care of any initialization that needs to be done when the app
   * first starts up, good example would be upgrading files or creating
   * the initial app directory for the user
  */
  private initialize() {
    if (!fs.existsSync(this.appDir)) {
      fs.mkdirSync(this.appDir);
    }

    marked.setOptions({
      renderer: new TerminalRenderer()
    });
  }

  /**
   * Show the journal entries that match the supplied filter in the terminal
   * after rendering them from Markdown
   *
   * @param filter The filter to use to determine which journal entries to show
   */
  async showJournalEntries(filter: FilterParams) {
    let filename = this.getFileName(filter.journal);
    let journal = await Journal.load(filename);

    // Non-empty filter
    const nonEmptyKeys = ['from', 'to', 'on', 'last'];
    if (nonEmptyKeys.some(key => filter[key])) {
      console.log("Non-empty filter!");
      let filtered = this.filterService.filter(journal, filter);
      filtered.forEach(entry => console.log(marked(entry.body.trim())));
      return;
    }

    for (const entry of journal.listAll()) {
      const rendered = marked(entry.body.trim());
      console.log(rendered);
    }
  }
}
