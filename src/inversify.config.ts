import {Application} from './application';
import {Container} from 'inversify';
import {ConfigService} from './config/config-service';
import {EditorService} from './editor/editor-service';
import {FilterService} from './filter/filter-service';

const container = new Container();
container.bind<Application>(Application).toSelf();
container.bind<EditorService>(EditorService).toSelf();
container.bind<FilterService>(FilterService).toSelf();
container.bind<ConfigService>(ConfigService).toSelf();

export { container };
