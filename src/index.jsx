import {IO, Plugin} from '@nebulario/core-plugin-request';

import * as Dependencies from './dependencies';
import * as Build from './build';
import * as Run from './run';
import {publish} from './publish';

(async () => {

  await Plugin.run("config", {
    dependencies: {
      list: Dependencies.list,
      sync: Dependencies.sync
    },
    run: {
      start: Run.start
    },
    build: {
      configure: Build.configue,
      init: Build.init,
      start: Build.start
    },
    publish
  });

})().catch(e => {
  IO.sendEvent("plugin.fatal", {data: e.message});
  throw e;
});
