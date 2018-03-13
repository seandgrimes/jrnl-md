import 'mocha';
import {expect} from 'chai';
import {Entry} from '../storage/entry';
import {FilterParams} from '../filter/filter-params';
import {FilterService} from '../filter/filter-service';
import {RangeFilter, FilterResult} from '../filter/filters';
import {StorageService} from '../storage/storage-service';

describe('The RangeFilter', () => {
  const testEntries: Entry[] = [
    { date: '2018-02-18 12:00 PM', body: 'Entry 1' },
    { date: '2018-02-21 01:00 PM', body: 'Entry 2' },
    { date: '2018-02-21 02:00 PM', body: 'Entry 3' },
    { date: '2018-02-24 02:00 PM', body: 'Entry 4' }
  ];

  let filterParams: FilterParams = null;

  before(() => {
    filterParams = {
      from: null,
      to: null,
      on: null,
      last: null,
      journal: 'personal'
    };
  });

  it('should return the correct entries', () => {
    // Arrange
    filterParams.from = '2018-02-18';
    filterParams.to = '2018-02-21';
    const sut = new RangeFilter();
    const expected = testEntries.slice(0, 3);

    // Act
    var results = sut.execute(testEntries, filterParams).map(fr => fr.entry);
    
    // Assert
    expect(results).to.deep.equal(expected);
  });
});