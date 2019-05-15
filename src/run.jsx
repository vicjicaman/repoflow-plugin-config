import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import YAML from 'yamljs';
import {
  spawn,
  wait
} from '@nebulario/core-process';
import {
  IO
} from '@nebulario/core-plugin-request';


const modify = (folder, compFile, func) => {
  const inputPath = path.join(folder, "dist");
  const outputPath = path.join(folder, "runtime");

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  const srcFile = path.join(inputPath, compFile);
  const destFile = path.join(outputPath, compFile);

  const raw = fs.readFileSync(srcFile, "utf8");
  const content = YAML.parse(raw);
  const mod = func(content);

  fs.writeFileSync(destFile, YAML.stringify(mod, 10, 2), "utf8");
}

export const start = (params, cxt) => {

  const watcher = async (operation, cxy) => {

    const {
      operationid
    } = operation;



    await wait(2500);

    IO.sendEvent("started", {
      operationid,
      data: ""
    }, cxt);

    while (operation.status !== "stopping") {
      IO.sendEvent("out", {
        operationid,
        data: "..."
      }, cxt);
      await wait(2500);
    }

    await wait(2500);

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





/*



/*const {
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
    },
    instance: {
      instanceid
    }
  },
  modules
} = params;

modify(folder, "service.yaml", content => content);
modify(folder, "deployment.yaml", content => content);




task ->


execution
- clear
- init
- start
  - restart
  - stop


plugin
- clear -> lock request
- init  -> lock request
- start -> start operation! => return opid -> saved by the execution -> start and immediate return started!... or error!
  - restart -> wait stop within plugin and return started!...
  - stop -> wait stop within plugin and return stopped!





*/
