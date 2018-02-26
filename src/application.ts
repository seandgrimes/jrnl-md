import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {EditorService} from './editor/editor-service';
import {Entry} from './storage/entry';
import {StorageService} from './storage/storage-service';

export class Application {
  private appDir: string;
  private editorService = new EditorService();
  private storageService: StorageService;

  constructor() {
    this.appDir = path.join(os.homedir(), '.jrnl-md');
    this.storageService = new StorageService(this.appDir);
    this.initialize();
  }

  async createJournalEntry(filename: string) {
    let journals: Entry[] = [];

    try {
      const journalPath = path.join(this.appDir, filename);
      if (fs.existsSync(journalPath)) {
        journals = await this.storageService.loadEntries(filename);
      }
    } catch (ex) {
      console.log(`Error opening journal file: ${ex}`);
      throw ex;
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
      throw ex;
    }
  }

  private initialize() {
    if (!fs.existsSync(this.appDir)) {
      fs.mkdirSync(this.appDir);
    }
  }
}