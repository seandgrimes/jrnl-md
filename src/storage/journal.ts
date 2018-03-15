import {Entry} from './entry';
import {TreeNode} from './tree-node';
import * as fs from 'fs';
import * as moment from 'moment';

export class Journal {
  private filename: string;
  private database: TreeNode;

  private constructor(database: TreeNode, filename: string) {
    this.filename = filename;
    this.database = database;
  }

  addEntry(entry: Entry) {
    let entryDate = moment(entry.date);
    const year = entryDate.year().toString();
    const month = entryDate.month().toString();
    const day = entryDate.day().toString();

    let yearNode = this.database.createChildUnlessExists(year);
    let monthNode = this.database.createChildUnlessExists(month);
    let dayNode = this.database.createChildUnlessExists(day);

    let key = entryDate.toISOString();
    dayNode.addChild(new TreeNode(key, entry));
  }

  static load(filename: string) : Promise<Journal> {
    return new Promise<Journal>((resolve, reject) => {
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          let database = JSON.parse(data) as TreeNode;
          resolve(new Journal(database, filename));
        } catch (ex) {
          reject(ex);
        }
      });
    });
  }

  save() : Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.filename, JSON.stringify(this.database), 'utf8', err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}
