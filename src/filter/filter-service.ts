import 'reflect-metadata';
import {injectable} from 'inversify';
import {Entry} from '../storage/entry';
import {FilterParams} from './filter-params';
import {RangeFilter, LastFilter, FromFilter, Filter, OnFilter} from './filters';
import * as moment from 'moment';
import { Journal } from '../storage/journal';
import {flattenArray} from '../util/arrays';

/**
 * Service used to filter journal entries based off the filter criteria
 * supplied by the user
 */
@injectable()
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
  filter(journal: Journal, filterParams: FilterParams) : Entry[] {
    const filters: Filter[] = [
      new RangeFilter(),
      new LastFilter(),
      new FromFilter(),
      new OnFilter()
    ];

    /*let filterResults: FilterResult[] = [];
    const matchedFilters = filters.filter(f => f.shouldExecute(filter));

    matchedFilters.forEach(match => {
      const filtered = match.execute(journal, filter);
      filterResults.push(...filtered);
    });

    return matchedFilters.length > 0
      ? filterResults
      : []; // Need to be able to show all*/

    return filters.filter(filter => filter.shouldExecute(filterParams))
      .map(filter => filter.execute(journal, filterParams))
      .reduce(flattenArray, []);
  }
}
