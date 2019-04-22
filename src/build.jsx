import path from 'path'
import fs from 'fs'
import {
  spawn
} from '@nebulario/core-process';
import {
  Operation,
  IO,
  JSON,
  Config
} from '@nebulario/core-plugin-request';

export const start = (params, cxt) => {

  // ### TAKE THE MODULE BASELINE FROM THE PARAMS!!! === ONLY SAME BASELINE CONFIGS ARE ALLOWED
  const {
    module: {
      code: {
        paths: {
          absolute: {
            folder
          }
        }
      }
    },
    modules
  } = params;

  try {

    IO.sendEvent("build.out.building", {
      data: ""
    }, cxt);

    const distFolder = path.join(folder, "dist");
    const config = JSON.load(path.join(folder, "config.json"));

    const dependenciesConfigValues = {};
    const configValues = {};

    for (const moduleid in config.dependencies) {
      const {
        version
      } = config.dependencies[moduleid];


      if (version.startsWith("file:")) {
        const localFolder = path.join(folder, version.replace("file:", ""));
        const depConfig = JSON.load(path.join(localFolder, "dist", "config.json"));

        for (const entry in depConfig) {
          dependenciesConfigValues[entry + '@' + moduleid] = depConfig[entry].value;
        }

      } else {
        // get the content from the namespace

      }
      //

    }


    for (const entry of config.config) {
      configValues[entry.name] = {
        value: Config.replace(Config.replace(entry.value, configValues), dependenciesConfigValues),
        type: entry.type || null
      };
    }


    JSON.save(path.join(distFolder, "config.json"),
      configValues
    );

    IO.sendEvent("build.out.done", {
      data: ""
    }, cxt);

  } catch (e) {
    IO.sendEvent("build.out.error", {
      data: e.toString()
    }, cxt);
  }

  return null;
}
