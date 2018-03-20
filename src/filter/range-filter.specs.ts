import 'mocha';
import {expect} from 'chai';
import {Entry} from '../storage/entry';
import {FilterParams} from '../filter/filter-params';
import {FilterService} from '../filter/filter-service';
import {RangeFilter} from '../filter/filters';
import { Journal } from '../storage/journal';
import { TreeNode } from '../storage/tree-node';

describe('The RangeFilter', () => {
  let filterParams: FilterParams = null;

  before(() => {
    filterParams = { journal: 'personal' };
  });

  const buildJournal = (entries: Entry[]) : Journal => {
    const journal = new Journal(new TreeNode(null, null), "bogus.json");
    entries.forEach(journal.addEntry.bind(journal));
    return journal;
  }

  describe('Should return the correct results', () => {

    it('when there are multiple entries on the end date', () => {
      // Arrange
      const testEntries: Entry[] = [
        { date: '2018-02-18T12:00Z', body: 'Entry 1' },
        { date: '2018-02-21T13:00Z', body: 'Entry 2' },
        { date: '2018-02-21T14:00Z', body: 'Entry 3' },
        { date: '2018-02-24T14:00Z', body: 'Entry 4' }
      ];

      filterParams.from = '2018-02-18';
      filterParams.to = '2018-02-21';

      const sut = new RangeFilter();
      const expected = testEntries.slice(0, 3);

      // Act
      const results = sut.execute(buildJournal(testEntries), filterParams);

      // Assert
      expect(results).to.deep.equal(expected);
    });

    it('when there are multiple entries on the start date', () => {
      // Arrange
      const testEntries: Entry[] = [
        { date: '2018-02-18T12:00Z', body: 'Entry 1' },
        { date: '2018-02-18T13:00Z', body: 'Entry 2' },
        { date: '2018-02-21T13:00Z', body: 'Entry 3' },
        { date: '2018-02-24T24:00Z', body: 'Entry 4' }
      ];

      filterParams.from = '2018-02-18';
      filterParams.to = '2018-02-21';

      const sut = new RangeFilter();
      const expected = testEntries.slice(0, 3);

      // Act
      const results = sut.execute(buildJournal(testEntries), filterParams);

      // Assert
      expect(results).to.deep.equal(expected);
    });

    it('when there are multiple entries on the start date and the start date is in the middle of the list', () => {
      // Arrange
      const testEntries: Entry[] = [
        { date: '2018-02-18T12:00Z', body: 'Entry 1' },
        { date: '2018-02-18T13:00Z', body: 'Entry 2' },
        { date: '2018-02-21T13:00Z', body: 'Entry 3' },
        { date: '2018-02-21T14:00Z', body: 'Entry 4' },
        { date: '2018-02-25T13:00Z', body: 'Entry 5' },
        { date: '2018-02-26T12:00Z', body: 'Entry 6' }
      ];

      filterParams.from = '2018-02-21';
      filterParams.to = '2018-02-25';

      const sut = new RangeFilter();
      const expected = testEntries.slice(2, 5);

      // Act
      const results = sut.execute(buildJournal(testEntries), filterParams);

      // Assert
      expect(results).to.deep.equal(expected);
    });
  });
});
