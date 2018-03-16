import 'mocha';
import {expect} from 'chai';
import {Entry} from '../storage/entry';
import {FilterParams} from '../filter/filter-params';
import {FilterService} from '../filter/filter-service';
import {LastFilter} from '../filter/filters';
import {StorageService} from '../storage/storage-service';
import { Journal } from '../storage/journal';
import { TreeNode } from '../storage/tree-node';

describe('The LastFilter', () => {

  const testEntries: Entry[] = [
    { date: '2018-02-28T12:00Z', body: 'Entry 1' },
    { date: '2018-02-28T13:00Z', body: 'Entry 2' },
    { date: '2018-02-28T14:00Z', body: 'Entry 3' },
    { date: '2018-02-28T15:00Z', body: 'Entry 4' },
    { date: '2018-02-28T16:00Z', body: 'Entry 5' }
  ];

  let filterParams : FilterParams = null;
  let journal : Journal = null;

  before(() => {
    filterParams = { journal: 'personal' };
    journal = new Journal(new TreeNode(null, null), "blah.json");
    testEntries.forEach(journal.addEntry.bind(journal));
  });

  describe('When the journal contains more entries than requested', () => {
    it('then the filter returns the correct journal entries', () => {
      // Arrange
      filterParams.last = 3;
      const expected = testEntries.slice(-1*filterParams.last);
      const sut = new LastFilter();

      // Act
      const results = sut.execute(journal, filterParams);

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
      const results = sut.execute(journal, filterParams);

      // Assert
      expect(results).to.deep.equal(testEntries);
    });
  });

  describe('When the journal contains the same number of entries as requested', () => {
    it('then the filter returns the correct journal entries', () => {
      // Arrange
      filterParams.last = testEntries.length;
      const sut = new LastFilter();

      // Act
      const results = sut.execute(journal, filterParams);

      // Assert
      expect(results).to.deep.equal(testEntries);
    });
  });

  it('should return the original journal entries', () => {
    // Arrange
    filterParams.last = testEntries.length;
    const sut = new LastFilter();

    // Act
    const results = sut.execute(journal, filterParams);

    // Assert
    expect(results.length).to.be.greaterThan(0);
    results.forEach((actual, index) => {
      expect(actual).to.equal(testEntries[index]);
    });
  });
});
