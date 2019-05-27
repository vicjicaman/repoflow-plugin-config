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
  JSON as JUtils,
  Config,
  Repository,
  Watcher
} from '@nebulario/core-plugin-request';



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

    const tmpFolder = path.join(folder, "tmp");

    if (fs.existsSync(tmpFolder)) {
      await exec(["rm -R " + tmpFolder], {}, {}, cxt)
    }

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

    const config = JUtils.load(path.join(folder, "config.json"));

    const distFolder = path.join(folder, "dist");
    if (!fs.existsSync(distFolder)) {
      fs.mkdirSync(distFolder);
    }
    const tmpFolder = path.join(folder, "tmp");
    if (!fs.existsSync(tmpFolder)) {
      fs.mkdirSync(tmpFolder);
    }
    const namespaceFolder = path.join(tmpFolder, "namespace")
    if (!fs.existsSync(namespaceFolder)) {
      fs.mkdirSync(namespaceFolder);

      IO.sendEvent("out", {
        data: "Clonning " + config.namespace + "..."
      }, cxt);

      await Repository.clone(config.namespace, namespaceFolder);
    }

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

    /*IO.sendEvent("started", {
      operationid,
      data: ""
    }, cxt);*/


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
      /*IO.sendEvent("out", {
        operationid,
        data: "..."
      }, cxt);*/
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

    const distFolder = path.join(folder, "dist");
    const config = JUtils.load(path.join(folder, "config.json"));

    const dependenciesConfigValues = {};
    const configValues = {};

    for (const moduleid in config.dependencies) {
      const {
        version
      } = config.dependencies[moduleid];


      if (version.startsWith("file:")) {
        const localFolder = path.join(folder, version.replace("file:", ""));
        const depConfig = JUtils.load(path.join(localFolder, "dist", "config.json"));

        for (const entry in depConfig) {
          dependenciesConfigValues[entry + '@' + moduleid] = depConfig[entry].value;
        }

      } else {
        // get the content from the namespace
      }
    }


    for (const entry of config.config) {
      configValues[entry.name] = {
        value: Config.replace(Config.replace(entry.value, configValues), dependenciesConfigValues),
        type: entry.type || null
      };
    }


    JUtils.save(path.join(distFolder, "config.json"),
      configValues
    );

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
