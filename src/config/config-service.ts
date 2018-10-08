import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import * as util from 'util';
import {injectable} from 'inversify';
import {ConfigFile} from './config-file';

@injectable()
export class ConfigService {
  /**
   * Get the path to the folder in the user's home directory 
   * where files for the program should be stored
   */
  getStoragePath() : string {
    return path.join(os.homedir(), '.jrnl-md');
  }

  /**
   * Loads the config file from the program storage location on disk,
   * if the config file doesn't exist then one will be created with
   * appropriate defaults
   */
  getOrCreateConfigFile() : Promise<ConfigFile> {
    const configPath = path.join(this.getStoragePath(), "config.json");
    const existsAsync = util.promisify(fs.exists);
    const readFileAsync = util.promisify(fs.readFile);
    const writeFileAsync = util.promisify(fs.writeFile);
    
    return new Promise<ConfigFile>(async (resolve, reject) => {
      if (await existsAsync(configPath)) {
        readFileAsync(configPath, 'utf8')
          .then(json => {
            const configFile = JSON.parse(json) as ConfigFile;
            resolve(configFile);
          })
          .catch(reject);
        
        return;
      }

      const configFile : ConfigFile = {
        editor: process.env.EDITOR || ''
      };

      const json = JSON.stringify(configFile);
      writeFileAsync(configPath, json, { flag: 'w'})
        .then(() => resolve(configFile))
        .catch(err => {
          const message = `Couldn't create config file: ${err}`;
          reject(message);
        });
    });
  }
}