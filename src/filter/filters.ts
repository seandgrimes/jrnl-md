import * as moment from 'moment';
import {Entry} from '../storage/entry';
import {FilterParams} from '../filter/filter-params';
import {Journal, SearchFunc} from '../storage/journal';
import {TreeNode} from '../storage/tree-node';
import { flattenArray } from '../util/arrays';

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
   * Check if a value is null or undefined
   *
   * @param value The value to check if defined
   * @returns True if the value isn't null or undefined, false otherwise
   */
  protected isDefined(value: any) : boolean {
    return value !== undefined && value !== null;
  }
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
  execute(journal: Journal, filterParams: FilterParams) : Entry[];
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
  execute(journal: Journal, filterParams: FilterParams) : Entry[] {
    const startDate = moment(filterParams.from);
    const endDate = moment(filterParams.to);

    const startYear = startDate.year().toString();
    const startMonth = (startDate.month()+1).toString();
    const startDay = startDate.date().toString();

    const endYear = endDate.year().toString();
    const endMonth = (endDate.month()+1).toString();
    const endDay = endDate.date().toString();

        // Need to find everything that starts on the start date, if anything
    // After that, just need to keep doing in order traversal until I reach the end date in the range

    return journal.find(database => {
      const entries: Entry[] = [];
      const years = database.keys.filter(year => year >= startYear && year <= endYear)
        .map(year => database.findChild(year));

      years.forEach(year => {
        const beginningMonth = year.key === startYear
          ? startMonth
          : "1";

        const endingMonth = year.key === endYear
          ? endMonth
          : "12";

        const months = year.keys.filter(month => month >= beginningMonth && month <= endingMonth)
          .map(month => year.findChild(month));

        months.forEach(month => {
          const beginningDay = year.key === startYear && month.key === startMonth
            ? startDay
            : "1"; // Start of the month, smallest key we can have

          const endingDay = year.key === endYear && month.key === endMonth
            ? endDay
            : "31"; // End of the longest month, largest key we can have

          month.keys.filter(day => day >= beginningDay && day <= endingDay)
            .map(day => month.findChild(day).children)
            .reduce(flattenArray, [])
            .map(entry => entry.value)
            .forEach(entry => entries.push(entry));
        });
      });

      return entries;
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
  public execute(journal: Journal, filterParams: FilterParams) : Entry[] {
    return journal.find(database => {
      const entries: Entry[] = [];

      const fromDate = moment(filterParams.from);
      const year = fromDate.year().toString();
      const month = (fromDate.month()+1).toString();
      const day = fromDate.date().toString();

      this.processMatchingYear(year, month, day, database, entries);

      const reducer = (accumulator: TreeNode[], currentValue: TreeNode) => {
        accumulator.push(...currentValue.children);
        return accumulator;
      }

      var matching = database.keys.filter(key => key > year)
        .map(yearKey => database.findChild(yearKey))
        .reduce(reducer, []) // Gives us the months for each year
        .reduce(reducer, []) // Gives us the days for each month
        .reduce(reducer, []) // Gives us the entries for each day
        .forEach(entry => entries.push(entry.value));

      return entries;
    });
  }

  private processMatchingYear(year: string, month: string, day: string, database: TreeNode, entries: Entry[]) {
    const yearNode = database.findChild(year);
    if (yearNode == null) return;

    const reducer = (accumulator: TreeNode[], currentValue: TreeNode) => {
      accumulator.push(...currentValue.children);
      return accumulator;
    }

    const currentMonth = yearNode.findChild(month);
    if (currentMonth !== null) {
      const matching = currentMonth.keys.filter(key => key >= day)
        .map(key => currentMonth.findChild(key))
        .reduce(reducer, [])
        .forEach(entry => entries.push(entry.value));
    }

    yearNode.keys.filter(key => key > month)
      .map(key => currentMonth.findChild(key))
      .reduce(reducer, [])
      .forEach(entry => entries.push(entry.value));
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
  public execute(journal: Journal, filterParams: FilterParams) : Entry[] {
    const entries: Entry[] = [];

    const iterateDays = (month: TreeNode) => {
      const days = [...month.keys].reverse();
      for (const dayKey of days) {
        const day = month.findChild(dayKey);
        const children = [...day.children].reverse()
          .filter((value, index) => entries.length + index + 1 <= filterParams.last)
          .map(node => node.value);

        entries.push(...children);

        if (entries.length === filterParams.last) return true;
      }
      return false;
    };

    const iterateMonths = (year: TreeNode) => {
      const months = [...year.keys].reverse();
      for (const monthKey of months) {
        const month = year.findChild(monthKey);
        const done = iterateDays(month);
        if (done) return true;
      }
      return false;
    };

    const findEntries = (database) => {
      const years = [...database.keys].reverse();
      for (const yearKey of years) {
        const year = database.findChild(yearKey);
        const done = iterateMonths(year);
        if (done) break;
      }

      return entries;
    };

    return journal.find(findEntries).reverse();
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

export class OnFilter extends BaseFilter implements Filter {
  public execute(journal: Journal, filterParams: FilterParams) : Entry[] {
    return journal.find((database) => {
      const from = moment(filterParams.on);

      const year = database.findChild(from.year().toString());
      if (year === null) return [];

      const month = year.findChild((from.month() + 1).toString());
      if (month === null) return [];

      const day = month.findChild(from.date().toString());
      return day !== null
        ? day.children.map(entry => entry.value)
        : [];
    });
  }

  /**
   * Whether or not the filter should be executed base off the
   * supplied filter parameters
   *
   * @param filter The filter parameters to check
   * @returns True if the filter should execute, false otherwise
   */
  public shouldExecute(filterParams: FilterParams) : boolean {
    return this.isDefined(filterParams.on);
  }
}
