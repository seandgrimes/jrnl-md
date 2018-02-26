import {Entry} from '../storage/entry';

export class TempFileParser {
  static parse(contents: string) : Entry | null {
    // User exited the editor without saving anything
    if (contents.length === 0) return null;

    // Definitely not the most efficient way to do this, but this probably
    // won't matter from a performance perspective
    let lines = contents.split('\n');
    
    const entry: Entry = {
      date: lines.shift(),
      body: lines.join('\n')
    };

    return entry;
  }
}