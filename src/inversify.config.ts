import * as os from 'os';
import * as path from 'path';
import {Application} from './application';
import {Container} from 'inversify';
import {EditorService} from './editor/editor-service';
import {FilterService} from './filter/filter-service';
import {StorageService} from './storage/storage-service';

// Configuration variables
const appDir = path.join(os.homedir(), '.jrnl-md');

const container = new Container();
container.bind<Application>(Application).toSelf();
container.bind<EditorService>(EditorService).toSelf();
container.bind<FilterService>(FilterService).toSelf();
container.bind<StorageService>(StorageService).toConstantValue(new StorageService(appDir));

export { container };