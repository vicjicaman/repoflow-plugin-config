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




export const configure = async (params, cxt) => {

  const {
    configuration,
    module: {
      moduleid,
      mode,
      fullname,
      code: {
        paths: {
          absolute: {
            folder
          }
        },
        dependencies
      }
    },
    modules
  } = params;

  for (const dep of dependencies) {
    const {kind, filename, path, checkout} = dep;
    if (kind === "inner" || checkout === null) {
      continue;
    }

    if (configuration === "develop") {
      const ModInfo = _.find(modules, {moduleid: dep.moduleid});

      if (ModInfo) {
        await sync({
          module: {
            moduleid,
            code: {
              paths: {
                absolute: {
                  folder
                }
              }
            }
          },
          dependency: {
            filename,
            path,
            version: "file:./../" + dep.moduleid
          }
        }, cxt);
      }
    }

    if (configuration === "baseline") {
      if (checkout && checkout.baseline.current) {
        await sync({
          module: {
            moduleid,
            code: {
              paths: {
                absolute: {
                  folder
                }
              }
            }
          },
          dependency: {
            filename,
            path,
            version: checkout.baseline.current.version
          }
        }, cxt);
      }
    }

    if (configuration === "iteration") {
      if (checkout && checkout.iteration.current) {
        await sync({
          module: {
            moduleid,
            code: {
              paths: {
                absolute: {
                  folder
                }
              }
            }
          },
          dependency: {
            filename,
            path,
            version: checkout.iteration.current.version
          }
        }, cxt);
      }
    }

  }

  return {};
}



export const init = async (params, cxt) => {

  const {
    module: {
      moduleid,
      mode,
      fullname,
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

    const config = JSON.load(path.join(folder, "config.json"));

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
      await Repository.clone(params, config.namespace, namespaceFolder);
    }

    IO.sendEvent("init.out", {
      data: ""
    }, cxt);

  } catch (e) {
    IO.sendEvent("init.err", {
      data: e.toString()
    }, cxt);
  }



  return null;
}


export const start = (params, cxt) => {

  return {
    local: (params, cxt) => {

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

        IO.sendEvent("out.building", {
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

        IO.sendEvent("out.done", {
          data: ""
        }, cxt);

      } catch (e) {
        IO.sendEvent("out.error", {
          data: e.toString()
        }, cxt);
      }

      return null;


    }
  };
}
