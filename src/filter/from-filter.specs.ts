import 'mocha';
import {expect} from 'chai';
import {Entry} from '../storage/entry';
import {FilterParams} from '../filter/filter-params';
import {FilterService} from '../filter/filter-service';
import {FromFilter, FilterResult} from '../filter/filters';
import {StorageService} from '../storage/storage-service';

describe('The FromFilter', () => {
  let filterParams: FilterParams = null;

  before(() => {
    filterParams = {
      from: null,
      to: null,
      on: null,
      last: null,
      journal: 'personal'
    }
  });

  const testEntries: Entry[] = [
    { date: '2018-03-13T12:00Z', body: 'Entry 1' },
    { date: '2018-03-14T13:00Z', body: 'Entry 2' },
    { date: '2018-03-15T14:00Z', body: 'Entry 3' }
  ];

  it('should return a single result', () => {
    // Arrange
    filterParams.from = '2018-03-15';
    const sut = new FromFilter();
    const expected = testEntries.slice(-1);

    // Act
    const actual = sut.execute(testEntries, filterParams).map(fr => fr.entry);

    // Assert
    expect(actual).to.deep.equal(expected);
  });

  it('should return multiple results', () => {
    // Arrange
    filterParams.from = '2018-03-14';
    const expected = testEntries.slice(-2);
    const sut = new FromFilter();

    // Act
    const actual = sut.execute(testEntries, filterParams).map(fr => fr.entry);

    // Assert
    expect(actual).to.deep.equal(expected);
  });

  it('should return all results', () => {
    // Arrange
    filterParams.from = '2018-03-13';
    const sut = new FromFilter();
    const expected = testEntries;

    // Act
    const actual = sut.execute(testEntries, filterParams).map(fr => fr.entry);

    // Assert
    expect(actual).to.deep.equal(expected);
  });
});
