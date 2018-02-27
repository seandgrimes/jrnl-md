import {Entry} from '../storage/entry';
import {Filter} from './filter';
import * as moment from 'moment';

/**
 * Contains an entry that was found as part of applying a filter
 * to an array
 */
export interface FilterResult {
  /** 
   * The position of the entry within the original array, should make it easy
   * to replace the original with the #entry property if necessary 
   */
  position: number,
  
  /** 
   * The entry that was matched by the filter 
   */
  entry: Entry
}

/** 
 * The strategy to use to find the real starting index
 * of a needle during a binary search when the haystack
 * contains duplicates  
 */
enum DuplicateStrategy {
  checkLeft,
  checkRight
}

/** 
 * Service used to filter journal entries based off the filter criteria
 * supplied by the user 
 */
export class FilterService {
  /**
   * Performs a binary search to find the index of the needle within the haystack.
   * Since we may have sorted duplicates in the haystack, we can use the supplied
   * DuplicateStrategy to find the first or last index where the needle appears.
   * 
   * @param haystack The entries to search
   * @param needle The value to find the index of, in this case the date of the journal entry
   * @param duplicateStrategy The strategy to use when finding the correct index when duplicates exist
   * 
   * @returns The index of the needle, or -1 if the needle couldn't be found
   */
  private binarySearch(haystack: Entry[], needle: string, duplicateStrategy: DuplicateStrategy) : number {
    let left = 0;
    let right = haystack.length-1;
    
    while (true) {
      if (left > right) return -1; // Not found

      let middle = Math.floor((left+right)/2);
      let entry = haystack[middle];

      if (moment(entry.date).isBefore(needle)) {
        left = middle + 1;
        continue;
      }

      if (moment(entry.date).isAfter(needle)) {
        right = middle - 1;
        continue;
      }

      if (moment(entry.date).isSame(needle)) {
        // Do we want to handle duplicates here?
        return middle;
      }
    }
  }

  /**
   * Filters the supplied journal entries by the given filter, only returning those
   * entries that are matched by the filter
   * 
   * @param entries The entries to filter
   * @param filter The filter to use to filter the entries
   * 
   * @returns The entries that matched the filter
   */
  filter(entries: Entry[], filter: Filter) : FilterResult[] {
    if (filter.last) return this.filterLast(entries, filter.last);
    if (filter.from && !filter.to) return this.filterFrom(entries, filter.from);
    if (filter.from && filter.to) return this.filterRange(entries, filter.from, filter.to);
    
    // No filtering needs to be done, just return everything
    return entries.map<FilterResult>((value, idx) => {
      return {
        position: idx,
        entry: value
      }
    });
  }

  /**
   * Returns the journal entries that occur on or after the supplied start
   * date
   * 
   * @param entries The entries to filter
   * @param startDate The date that entries were created on or after
   * @param startIndex The index to start from if we already know where the first entry is
   */
  private filterFrom(entries: Entry[], startDate: string, startIndex: number = null) : FilterResult[] {
    startIndex = startIndex || this.binarySearch(entries, startDate, DuplicateStrategy.checkLeft);
    const endIndex = entries.length-1;

    // No entries found
    if (startIndex === -1) return [];

    const filtered = entries.slice(startIndex, endIndex-startIndex)
      .map((value, idx) => {
        return {
          position: idx,
          entry: value
        }
      });

    return filtered; 
  }

  /**
   * Returns the last n entries from the array
   * 
   * @param entries The entries to filter
   * @param count The number of entries from the end of the array to return
   * 
   * @returns The last n elements of the entries array
   */
  private filterLast(entries: Entry[], count: number) : FilterResult[] {
    const last = entries.slice(entries.length-count -1);
    const filtered = last.map<FilterResult>((value, idx) => { 
      return { 
        position: entries.length-count-idx-1, 
        entry: value
      } 
    });

    return filtered;
  }

  /**
   * Filters the supplied entries that fall between the supplied start and 
   * end date, the range of entries returns is inclusive
   * 
   * @param entries The entries to filter
   * @param startDate The start date to filter by
   * @param endDate The end date to filter by
   * 
   * @returns The filtered entries
   */
  private filterRange(entries: Entry[], startDate: string, endDate: string) : FilterResult[] {
    const startIndex = this.binarySearch(entries, startDate, DuplicateStrategy.checkLeft);
    const endIndex = this.binarySearch(entries, endDate, DuplicateStrategy.checkRight);

    if (startIndex >= 0 && endIndex === -1) {
      const filtered = this.filterLast(entries, entries.length-startIndex-1)
      return filtered;
    }

    const filtered = entries.slice(startIndex, endIndex-startIndex);
    return filtered.map((value, index) => {
      return {
        position: index + startIndex,
        entry: value
      }
    });
  }
}