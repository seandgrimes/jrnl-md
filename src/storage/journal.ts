import {Entry} from './entry';
import {TreeNode} from './tree-node';
import * as fs from 'fs';
import * as moment from 'moment';

export interface SearchFunc<TReturnType> {
  (database: TreeNode) : TReturnType[];
}

export class Journal {
  private filename: string;
  private database: TreeNode;

  constructor(database: TreeNode, filename: string) {
    this.filename = filename;
    this.database = database;
  }

  addEntry(entry: Entry) {
    let entryDate = moment(entry.date);
    const year = entryDate.year().toString();
    const month = (entryDate.month()+1).toString(); // Months are 0 indexed
    const day = entryDate.date().toString();

    let yearNode = this.database.createChildUnlessExists(year);
    let monthNode = yearNode.createChildUnlessExists(month);
    let dayNode = monthNode.createChildUnlessExists(day);

    let key = entryDate.toISOString();
    dayNode.addChild(new TreeNode(key, entry));
  }

  find<TFindType>(searchFunc: SearchFunc<TFindType>) : TFindType[] {
    return searchFunc(this.database);
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
