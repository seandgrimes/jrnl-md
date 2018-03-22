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
    if (!fs.existsSync(filename))
      return Promise.resolve(new Journal(new TreeNode(), filename));

    return new Promise<Journal>((resolve, reject) => {
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          let database = TreeNode.fromJson(data);
          resolve(new Journal(database, filename));
        } catch (ex) {
          console.log(ex);
          reject(ex);
        }
      });
    });
  }

  * listAll() : IterableIterator<Entry> {
    // Need to do an in-order traversal
    const queue : TreeNode[] = [this.database];

    while (queue.length > 0) {
      const node = queue.shift();

      // Only leaf-nodes should have a journal entry
      // associated with them
      if (node.value !== null) {
        yield node.value;
        continue;
      }

      // Keys should already be in order, so this will always
      // result in an in-order traversal
      node.keys.forEach(key => queue.push(node.findChild(key)));
    }
  }

  save() : Promise<void> {
    return new Promise((resolve, reject) => {
      const json = JSON.stringify(this.database);
      fs.writeFile(this.filename, json, 'utf8', err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}
