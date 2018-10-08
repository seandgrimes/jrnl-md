import 'mocha';
import * as moment from 'moment';
import {expect} from 'chai';
import {DATE_FORMAT} from '../constants';
import {JournalTempFile} from './journal-temp-file';

describe('JournalTempFile', () => {
  describe('When writing a journal entry to the temp file', () => {

    it ("the journal entry date isn't added to the file twice on edit", async () => {
      // Arrange
      const tempFile = new JournalTempFile();
      const now = moment().toISOString();
      const entry = {
        date: now,
        body: `${now}\nThis is a test`
      };

      // Act
      await tempFile.write(entry, false);
      const written = await tempFile.read();
      const bodyLines = written.body.split('\n');

      // Assert
      expect(bodyLines[0]).not.to.be.equal(bodyLines[1]);
    });

    it('the journal date is written to the file for new entries', async () => {
      // Arrange
      const tempFile = new JournalTempFile();
      const now = moment().format(DATE_FORMAT);
      const entry = {
        date: now,
        body: 'This is a test'
      };

      // Act
      await tempFile.write(entry, true);
      const written = await tempFile.read();

      // Assert
      expect(now).to.equal(moment(written.date).format(DATE_FORMAT));
    });

    it('the journal body is written to the file', async () => {
      // Arrange
      const tempFile = new JournalTempFile();
      const entry = {
        date: moment().format(DATE_FORMAT),
        body: 'This is a test'
      };

      // Should probably change this behavior, but for now...
      const expected = `${entry.date}\n${entry.body}`;

      // Act
      await tempFile.write(entry, true);
      const written = await tempFile.read();

      // Assert
      expect(expected).to.equal(written.body);
    });
  });
});
