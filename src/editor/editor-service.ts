import * as fs from 'fs';
import * as moment from 'moment';
import * as os from 'os';
import * as process from 'process';
import * as uniqueFilename from 'unique-filename';
import {injectable} from 'inversify';
import {spawn} from 'child_process';
import {Entry} from '../storage/entry';
import {TempFileParser} from './tempfile-parser';

/** 
 * Editor service for interacting with the user's
 * default text editor to create and edit existing
 * journal entries
*/
@injectable()
export class EditorService {
  private editor: string;
  private tmpDir: string;

  /** 
   * Constructor
  */
  constructor() {
    this.editor = process.env.EDITOR;
    this.tmpDir = os.tmpdir();
  }

  /** 
   * Opens the user's default editor to create a new journal entry and then 
   * converts the temp file to a new journal entry once the editor closes
   * 
   * @returns A promise containing the new journal entry or null when it is resolved
  */
  createJournalEntry() : Promise<Entry> {
    const tempFile = this.generateTempFile();
    const entry: Entry = {
      date: moment().format(),
      body: ''
    };

    return this.spawnEditor(tempFile, entry);
  }

  /** 
   * Opens the user's default editor to edit an existing journal entry and then 
   * converts the temp file to a new journal entry once the editor closes
   * 
   * @returns A promise containing the new journal entry or null when it is resolved
  */
  editJournalEntry(entry: Entry) : Promise<Entry> {
    const tempFile = this.generateTempFile();
    return this.spawnEditor(tempFile, entry);
  }

  /** 
   * Generates a unique temp file name for use when creating
   * or editing existing journal entries
   * 
   * @returns A unique temp file name
  */
  private generateTempFile() : string {
    return uniqueFilename(this.tmpDir) + '.md';
  }

  /**
   * Opens the specified temp file in the user's default editor
   * 
   * @param tempFile The temp file to open in the user's editor
   * @returns A promise with the parsed Entry from the temp file
   */
  private spawnEditor(tempFile: string, entry: Entry) : Promise<Entry> {
    const openEditor = () => {
      const editorParts = this.editor.split(' ').filter(entry => entry.trim() !== '');
      const editorCmd = editorParts.shift();
      const args = editorParts || [];
      
      return new Promise<void>((resolve, reject) => {
        args.push(tempFile);
        const editor = spawn(editorCmd, args);      
        editor.on('close', (code) => {
          code !== 0 
            ? reject(`Editor exited with code ${code}`) 
            : resolve();
        });
      });
    }

    const readTempFile = () => { 
      return new Promise<Entry>((resolve, reject) => {
        fs.readFile(tempFile, 'utf8', (err, data) => {
          if (!err) {
            const entry = TempFileParser.parse(data);
            resolve(entry);
            return;
          }

          reject(err);
        });
      });
    }

    return this.writeToTempFile(tempFile, entry)
      .then(() => openEditor())
      .then(() => readTempFile());
  }

  /**
   * Writes the specified journal entry to the specified
   * temp file
   * 
   * @param tempFile The temp file to write the entry to
   * @param entry The entry to write to the temp file
   * @returns A promise that is resolved once the write is complete and rejected on error
   */
  private writeToTempFile(tempFile: string, entry: Entry) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const contents = `${entry.date}\n${entry.body}`;
      fs.writeFile(tempFile, contents, { flag: 'w' },  (err) => {
        err ? reject(err) : resolve(tempFile);
      });
    });
  }
}