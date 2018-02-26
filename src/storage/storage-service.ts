import {Entry} from './entry';
import * as path from 'path';
import * as fs from 'fs';

/** 
 * Storage service used for writing and retrieving
 * the data file that contains the journal entries
*/
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
  loadEntries(filename: string) : Promise<Entry[]> {
    return new Promise<Entry[]>((resolve, reject) => {
      const filePath = path.join(this.basePath, filename);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          var json = JSON.parse(data) as Entry[];
          resolve(json); 
        }
        catch (ex) {
          reject(ex);
        }
      });
    });
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