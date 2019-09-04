import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import YAML from 'yamljs';
import {
  exec,
  spawn,
  wait
} from '@nebulario/core-process';
import {
  Operation,
  IO,
  Watcher
} from '@nebulario/core-plugin-request';

import * as Config from '@nebulario/core-config';



export const clear = async (params, cxt) => {

  const {
    performer: {
      type,
      code: {
        paths: {
          absolute: {
            folder
          }
        }
      }
    }
  } = params;

  if (type !== "instanced") {
    throw new Error("PERFORMER_NOT_INSTANCED");
  }

  try {
    await Config.clear(folder);
  } catch (e) {
    IO.sendEvent("error", {
      data: e.toString()
    }, cxt);
    throw e;
  }

  return "Configuration cleared";
}



export const init = async (params, cxt) => {

  const {
    performer: {
      type,
      code: {
        paths: {
          absolute: {
            folder
          }
        }
      }
    }
  } = params;

  if (type !== "instanced") {
    throw new Error("PERFORMER_NOT_INSTANCED");
  }

  try {
    await Config.init(folder);
  } catch (e) {
    IO.sendEvent("error", {
      data: e.toString()
    }, cxt);
    throw e;
  }

  return "Config namespace initialized";
}

export const start = (params, cxt) => {

  const {
    performer: {
      type,
      code: {
        paths: {
          absolute: {
            folder
          }
        }
      }
    }
  } = params;

  if (type !== "instanced") {
    throw new Error("PERFORMER_NOT_INSTANCED");
  }


  const configPath = path.join(folder, "config.json");

  const watcher = async (operation, cxt) => {

    const {
      operationid
    } = operation;

    await wait(100);

    IO.sendEvent("out", {
      operationid,
      data: "Watching config changes for " + configPath
    }, cxt);

    await build(operation, params, cxt);
    const watcher = Watcher.watch(configPath, () => {

      IO.sendEvent("out", {
        operationid,
        data: "config.json changed..."
      }, cxt);

      build(operation, params, cxt);

    })

    while (operation.status !== "stopping") {
      await wait(2500);
    }

    watcher.close();
    await wait(100);

    IO.sendEvent("stopped", {
      operationid,
      data: ""
    }, cxt);
  }


  return {
    promise: watcher,
    process: null
  };
}




const build = (operation, params, cxt) => {

  const {
    performer: {
      type,
      code: {
        paths: {
          absolute: {
            folder
          }
        }
      }
    }
  } = params;

  const {
    operationid
  } = operation;

  try {

    IO.sendEvent("out", {
      operationid,
      data: "Start building config..."
    }, cxt);

    Config.build(folder);

    IO.sendEvent("done", {
      operationid,
      data: "Config generated: dist/config.json"
    }, cxt);

  } catch (e) {
    IO.sendEvent("error", {
      operationid,
      data: e.toString()
    }, cxt);
  }
  
}
