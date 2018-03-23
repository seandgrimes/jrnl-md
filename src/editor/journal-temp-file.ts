import * as fs from 'fs';
import * as os from 'os';
import * as uniqueFilename from 'unique-filename';
import {Entry} from '../storage/entry';

/**
 * Class for working with temp files used for journal
 * entries
 */
export class JournalTempFile {
  constructor(public filename: string = null) {
    this.filename = this.filename || uniqueFilename(os.tmpdir()) + '.md';
  }

  /**
   * Reads the entry from the temp file
   * @returns A promise that is resolved once the read is complete
   */
  read() : Promise<Entry> {
    return new Promise<Entry>((resolve, reject) => {
      fs.readFile(this.filename, 'utf8', (err, data) => {
        if (!err) {
          const entry = TempFileParser.parse(data);
          resolve(entry);
          return;
        }

        reject(err);
      });
    });
  }

  /**
   * Writes the specified journal entry to the temp file
   *
   * @param entry The entry to write to the temp file
   * @param isNewEntry Whether or not we're writing a new or existing entry to the temp file
   * @returns A promise that is resolved once the write is complete and rejected on error
   */
  write(entry: Entry, isNewEntry: boolean) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const contents = isNewEntry
        ? `${entry.date}\n${entry.body}`
        : entry.body;

      fs.writeFile(this.filename, contents, { flag: 'w' },  (err) => {
        err ? reject(err) : resolve(this.filename);
      });
    });
  }
}

class TempFileParser {
  static parse(contents: string) : Entry | null {
    // User exited the editor without saving anything
    if (contents.length === 0) return null;

    // Definitely not the most efficient way to do this, but this probably
    // won't matter from a performance perspective
    let lines = contents.split('\n');

    const entry: Entry = {
      date: lines[0],
      body: lines.join('\n')
    };

    return entry;
  }
}
