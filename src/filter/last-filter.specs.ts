import 'mocha';
import {expect} from 'chai';
import {Entry} from '../storage/entry';
import {FilterParams} from '../filter/filter-params';
import {FilterService} from '../filter/filter-service';
import {LastFilter, FilterResult} from '../filter/filters';
import {StorageService} from '../storage/storage-service';

describe('The LastFilter', () => {

  const testEntries: Entry[] = [
    { date: '2018-02-28 12:00 PM', body: 'Entry 1' },
    { date: '2018-02-28 01:00 PM', body: 'Entry 2' },
    { date: '2018-02-28 02:00 PM', body: 'Entry 3' },
    { date: '2018-02-28 03:00 PM', body: 'Entry 4' },
    { date: '2018-02-28 04:00 PM', body: 'Entry 5' }
  ];
  
  let filterParams : FilterParams = null; 

  before(() => {
    filterParams = {
      from: null,
      to: null,
      on: null,
      last: null,
      journal: 'personal',
    }
  });

  describe('When the journal contains more entries than requested', () => {
    it('then the filter returns the correct journal entries', () => {
      // Arrange
      filterParams.last = 3;
      const expected = testEntries.slice(-1*filterParams.last);
      const sut = new LastFilter();

      // Act
      const results = sut.execute(testEntries, filterParams).map(fr => fr.entry);

      // Assert
      expect(results).to.deep.equal(expected);
    });

    it('then the position of each returned journal entry matches the original list', () => {
      // Arrange
      filterParams.last = 3;
      const sut = new LastFilter();
      const expected : FilterResult[] = [
        { position: 2, entry: testEntries[2] },
        { position: 3, entry: testEntries[3] },
        { position: 4, entry: testEntries[4] }
      ];

      // Act
      const results = sut.execute(testEntries, filterParams);

      // Assert
      expect(results).to.deep.equal(expected);
    });
  });

  describe('When the journal contains less entries than requested', () => {
    it('then all the journal entries are returned', () => {
      // Arrange
      filterParams.last = testEntries.length+3;
      const sut = new LastFilter();

      // Act
      const results = sut.execute(testEntries, filterParams).map(fr => fr.entry);

      // Assert
      expect(results).to.deep.equal(testEntries);
    });

    it('then the position of each returned journal entry matches the original list', () => {
      // Arrange
      filterParams.last = testEntries.length+3;
      const sut = new LastFilter();
      const expected = testEntries.map((value, idx) => {
        return { position: idx, entry: value}
      });

      // Act
      const results = sut.execute(testEntries, filterParams);

      // Assert
      expect(results).to.deep.equal(expected);
    });
  });

  describe('When the journal contains the same number of entries as requested', () => {
    it('then the filter returns the correct journal entries', () => {
      // Arrange
      filterParams.last = testEntries.length+3;
      const sut = new LastFilter();

      // Act
      const results = sut.execute(testEntries, filterParams).map(fr => fr.entry);

      // Assert
      expect(results).to.deep.equal(testEntries);
    });

    it('then the position of each returned journal entry matches the original list', () => {
      // Arrange
      filterParams.last = testEntries.length+3;
      const sut = new LastFilter();
      const expected = testEntries.map((value, idx) => {
        return { position: idx, entry: value}
      });

      // Act
      const results = sut.execute(testEntries, filterParams);

      // Assert
      expect(results).to.deep.equal(expected);
    });
  });
});