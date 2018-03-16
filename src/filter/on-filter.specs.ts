import 'mocha';
import {expect} from 'chai';
import {Entry} from '../storage/entry';
import {FilterParams} from '../filter/filter-params';
import {FilterService} from '../filter/filter-service';
import {OnFilter} from '../filter/filters';
import {Journal} from '../storage/journal';
import {StorageService} from '../storage/storage-service';
import {TreeNode} from '../storage/tree-node';

describe('The OnFilter', () => {
  let filterParams : FilterParams = null;
  let journal : Journal;

  const testData : Entry[] = [
    { date: '2018-03-13T12:00Z', body: 'Entry 1' },
    { date: '2018-03-14T12:00Z', body: 'Entry 2' },
    { date: '2018-03-14T14:00Z', body: 'Entry 3' },
    { date: '2018-03-15T12:00Z', body: 'Entry 4' }
  ];

  before(() => {
    filterParams = { journal: 'personal' };
    journal = new Journal(new TreeNode(null, null), "blah.json");
    testData.forEach(journal.addEntry.bind(journal));
  });

  it('should return the correct results', () => {
    // Arrange
    filterParams.on = '2018-03-14';
    const sut = new OnFilter();
    const expected = testData.slice(1, 3);

    // Act
    const actual = sut.execute(journal, filterParams);

    // Assert
    expect(actual).to.deep.equal(expected);
  });
});
