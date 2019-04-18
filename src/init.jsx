import _ from 'lodash'
import path from 'path'
import fs from 'fs'
import {
  spawn
} from '@nebulario/core-process';
import {
  Operation,
  IO,
  JSON,
  Repository
} from '@nebulario/core-plugin-request';

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
