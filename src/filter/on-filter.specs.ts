import 'mocha';
import {expect} from 'chai';
import {Entry} from '../storage/entry';
import {FilterParams} from '../filter/filter-params';
import {FilterService} from '../filter/filter-service';
import {FromFilter, FilterResult} from '../filter/filters';
import {StorageService} from '../storage/storage-service';

describe('The OnFilter', () => {
  let filterParams : FilterParams = null;

  before(() => {
    filterParams = { journal: 'personal' };
  });

  const testData : Entry[] = [
    { date: '2018-03-13T12:00Z', body: 'Entry 1' },
    { date: '2018-03-14T12:00Z', body: 'Entry 2' },
    { date: '2018-03-14T14:00Z', body: 'Entry 3' },
    { date: '2018-03-15T12:00Z', body: 'Entry 4' }
  ];
});
