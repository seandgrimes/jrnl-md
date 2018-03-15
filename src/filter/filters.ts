import * as moment from 'moment';
import {Entry} from '../storage/entry';
import {FilterParams} from '../filter/filter-params';

/** 
 * The strategy to use to find the real starting index
 * of a needle during a binary search when the haystack
 * contains duplicates  
 */
export enum DuplicateStrategy {
  checkLeft,
  checkRight
}

abstract class BaseFilter {
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
  protected findFirstOnOrAfterDate(entries: Entry[], date: string, duplicateStrategy: DuplicateStrategy) : number {
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
      if (left > right) return duplicateStrategy == DuplicateStrategy.checkRight ? left - 1 : left;

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

  /**
   * Check if a value is null or undefined
   * 
   * @param value The value to check if defined
   * @returns True if the value isn't null or undefined, false otherwise
   */
  protected isDefined(value: any) : boolean {
    return value !== undefined && value !== null;
  }

  protected setToEndOfDay(date: string) : string {
    return moment(date)
      .hour(23)
      .minute(59)
      .second(59)
      .millisecond(999)
      .format('LLLL');
  }

  protected setToStartOfDay(date: string) : string {
    return moment(date)
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0)
      .format('LLLL');
  }
}

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
 * Interface used for defining new journal entry filters 
 */
export interface Filter {
  /**
   * Filters the journal entries based off the supplied filter params
   * 
   * @param entries The journal entries to filter 
   * @param filterParams The filter parameters to use
   */
  execute(entries: Entry[], filterParams: FilterParams) : FilterResult[];
  shouldExecute(filterParams: FilterParams) : boolean;
}

/** 
 * Filter for finding all journal entries whose entry date falls between
 * the start and end date of the filter parameters
 */
export class RangeFilter extends BaseFilter implements Filter {
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
  execute(entries: Entry[], filterParams: FilterParams) : FilterResult[] {
    const startIndex = this.findFirstOnOrAfterDate(
      entries, 
      this.setToStartOfDay(filterParams.from), 
      DuplicateStrategy.checkLeft);
    
    let endIndex = this.findFirstOnOrAfterDate(
      entries, 
      this.setToEndOfDay(filterParams.to), 
      DuplicateStrategy.checkRight);

    if (startIndex >= 0 && endIndex === -1) {
      endIndex = entries.length-1;
    }

    const filtered = entries.slice(startIndex, endIndex+1);
    return filtered.map((value, index) => {
      return {
        position: index + startIndex,
        entry: value
      }
    });
  }

  /**
   * Whether or not the filter should be executed base off the 
   * supplied filter parameters
   * 
   * @param filterParams The filter parameters to check
   * @returns True if the filter should execute, false otherwise
   */
  shouldExecute(filterParams: FilterParams) : boolean {
    const isDefined = (entry) => entry !== null && entry !== undefined;
    return isDefined(filterParams.from) && isDefined(filterParams.to);
  }
}

/** 
 * Filter for finding all journal entries whose entry date falls on
 * or after a specific date
 */
export class FromFilter extends BaseFilter implements Filter {
  /**
   * Returns the journal entries that occur on or after the supplied start
   * date
   * 
   * @param entries The entries to filter
   * @param startDate The date that entries were created on or after
   */
  public execute(entries: Entry[], filterParams: FilterParams) : FilterResult[] {
    const startIndex = this.findFirstOnOrAfterDate(entries, filterParams.from, DuplicateStrategy.checkLeft);

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
   * Whether or not the filter should be executed base off the 
   * supplied filter parameters
   * 
   * @param filterParams The filter parameters to check
   * @returns True if the filter should execute, false otherwise
   */
  public shouldExecute(filterParams: FilterParams) {
    return this.isDefined(filterParams.from) && !this.isDefined(filterParams.to);
  }
}

/** 
 * Filter for finding the last x number of entries that were
 * added to a journal
 */
export class LastFilter extends BaseFilter implements Filter {
  /**
   * Returns the last n entries from the array
   * 
   * @param entries The entries to filter
   * @param count The number of entries from the end of the array to return
   * 
   * @returns The last n elements of the entries array
   */
  public execute(entries: Entry[], filterParams: FilterParams) : FilterResult[] {
    const last = entries.length > filterParams.last
      ? entries.slice(-1*filterParams.last)
      : entries;

    const calculatePosition = (idx: number) => {
      return entries.length > filterParams.last
        ? entries.length - filterParams.last + idx
        : idx;
    }

    const filtered = last.map<FilterResult>((value, idx) => { 
      return {
        position: calculatePosition(idx), 
        entry: value
      } 
    });

    return filtered;
  }

  /**
   * Whether or not the filter should be executed base off the 
   * supplied filter parameters
   * 
   * @param filter The filter parameters to check
   * @returns True if the filter should execute, false otherwise
   */
  public shouldExecute(filterParams: FilterParams) : boolean {
    return this.isDefined(filterParams.last);
  }
}