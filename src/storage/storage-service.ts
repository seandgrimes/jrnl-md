import {Entry} from './entry';
import {injectable} from 'inversify';
import * as path from 'path';
import * as fs from 'fs';
import { Journal } from './journal';

/**
 * Storage service used for writing and retrieving
 * the data file that contains the journal entries
*/
@injectable()
export class StorageService {
  /**
   * Constructor
   * @param basePath The base path where entries are saved
   */
  constructor(private basePath: string) {
    // Empty constructor
  }

  /**
   * Loads entries from the filesystem
   * @param filename The name of the file to save the entries to
   * @returns A promise containing the loaded entries
   */
  loadJournal(filename: string) : Promise<Journal> {
    const filepath = path.join(this.basePath, filename);
    return Journal.load(filepath);
  }

  /**
   * Saves entries to the filesystem
   * @param filename The name of the file to save the entries to
   * @param entries The entries to save to the file
   * @returns A promise that executes when the save completes
   */
  saveEntries(filename: string, entries: Entry[]) : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const filePath = path.join(this.basePath, filename);
      fs.writeFile(filePath, JSON.stringify(entries), 'utf8', err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}
