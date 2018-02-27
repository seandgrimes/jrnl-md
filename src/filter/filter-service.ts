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
   */
  private filterFrom(entries: Entry[], startDate: string) : FilterResult[] {
    const startIndex = this.findFirstOnOrAfterDate(entries, startDate, DuplicateStrategy.checkLeft);
    const endIndex = entries.length-1;

    // No entries found
    if (startIndex === -1) return [];

    const filtered = entries.slice(startIndex)
      .map((value, idx) => {
        return {
          position: idx + startIndex,
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
    const last = entries.slice(-1*count);
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
    const startIndex = this.findFirstOnOrAfterDate(entries, startDate, DuplicateStrategy.checkLeft);
    const endIndex = this.findFirstOnOrAfterDate(entries, endDate, DuplicateStrategy.checkRight);

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

  /**
   * Performs a modified binary search to find the index of the first entry
   * that occurred on or after the date passed to the method. If the date 
   * supplied occurs before the date of all the journal entries, then the method
   * will return 0. If the date supplied occurs after the date of all the journal
   * entries, then -1 will be returned to signify there are no matches. Otherwise
   * the index of the first journal entry whose date is an exact match or the index
   * of the first journal whose date occurs after the supplied date will be returned.
   * 
   * @param entries The entries to search
   * @param date The date to use when finding journal entries that were created on or after that date
   * @param duplicateStrategy The strategy to use when finding the correct index when duplicates exist
   * 
   * @returns The index of the first match, or -1 if a match couldn't be found
   */
  private findFirstOnOrAfterDate(entries: Entry[], date: string, duplicateStrategy: DuplicateStrategy) : number {
    let left = 0;
    let right = entries.length-1;

    while (true) {
      // Not found. Needle is greater than everything in the haystack
      // so need to exclude everything
      if (left > right && left >= entries.length) return -1;

      // Not found. Needle is smaller than everything in the haystack
      // so need to include everything
      if (left > right && right < 0) return 0;

      // Not found. The value of left will always point to the index
      // of the first item in the haystack that was bigger than the
      // needle      
      if (left > right) return left;

      let middle = Math.floor((left+right)/2);
      let entry = entries[middle];

      if (moment(entry.date).isBefore(date)) {
        left = middle + 1;
        continue;
      }

      if (moment(entry.date).isAfter(date)) {
        right = middle - 1;
        continue;
      }

      if (moment(entry.date).isSame(date)) {
        middle = this.handleDuplicateMatches(entries, middle, duplicateStrategy);
        return middle;
      }
    }
  }

  /**
   * It's possible that we have multiple journal entries with the same date, so we need
   * to find the index of the duplicate that is furthest right or left of the found item,
   * depending on the use case
   * 
   * @param entries The entries array containing the found item 
   * @param foundIndex The index of the item that was found by our binary search algorithm
   * @param duplicateStrategy Whether to search left or right for duplicates
   */
  private handleDuplicateMatches(entries: Entry[], foundIndex: number, duplicateStrategy: DuplicateStrategy) : number {
    const incrementer = duplicateStrategy === DuplicateStrategy.checkRight ? 1 : - 1;
    let startOn = duplicateStrategy === DuplicateStrategy.checkRight ? foundIndex + 1 : foundIndex - 1;
    const stopOn = duplicateStrategy === DuplicateStrategy.checkRight ? entries.length : -1;
    const foundCreatedOn = moment(entries[foundIndex].date);
    
    let lastIndex = foundIndex;
    while (startOn != stopOn) {
      const currentDate = entries[startOn].date;
      if (!foundCreatedOn.isSame(currentDate)) return lastIndex;

      lastIndex = startOn;
      startOn += incrementer;
    }
  }
}