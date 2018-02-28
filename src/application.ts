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
import {StorageService} from './storage/storage-service';

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
   * @param storageService The StorageService implementation to use
  */
  constructor(
      private editorService:EditorService, 
      private filterService:FilterService, 
      private storageService:StorageService) {

    this.appDir = path.join(os.homedir(), '.jrnl-md');
    this.storageService = new StorageService(this.appDir);
    this.initialize();
  }

  /**
   * Create a new journal entry using the user's default
   * editor and then save the newly created journal entry
   * to the specified filename.
   * 
   * @param filename The filename to save the entries to
   */
  async createJournalEntry(filename: string) {
    let journals: Entry[] = [];
    
    if (!filename.endsWith('.json')) {
      filename = filename + '.json';
    }

    try {
      const journalPath = path.join(this.appDir, filename);
      if (fs.existsSync(journalPath)) {
        journals = await this.storageService.loadEntries(filename);
      }
    } catch (ex) {
      console.log(`Error opening journal file: ${ex}`);
      console.log(ex.stack);
    }
    
    try {
      const newEntry = await this.editorService.createJournalEntry();
      if (newEntry) {
        journals.push(newEntry);
        await this.storageService.saveEntries(filename, journals);
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
    let entries = await this.storageService.loadEntries(filename);
    let filtered = this.filterService.filter(entries, filter);

    for (var entry of filtered) {
      const updated = await this.editorService.editJournalEntry(entry.entry);
      entries[entry.position] = updated;
    }

    await this.storageService.saveEntries(filename, entries);
  }

  /**
   * Gets the filename for the provided journal
   * 
   * @param journal The journal to return the filename of
   * @returns The filename of the journal
   */
  private getFileName(journal: string) : string {
    return !journal.endsWith('.json')
      ? journal + '.json'
      : journal;
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
    let entries = await this.storageService.loadEntries(filename);
    let filtered = this.filterService.filter(entries, filter).map(e => e.entry);
    filtered.forEach(entry => console.log(marked(entry.body.trim())));
  }
}