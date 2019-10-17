import _ from "lodash";
import fs from "fs-extra";
import path from "path";
import { exec, spawn, wait } from "@nebulario/core-process";
import * as Performer from "@nebulario/core-performer";
import * as Config from "@nebulario/core-config";
import * as JsonUtil from "@nebulario/core-json";
import chokidar from "chokidar";

export const start = async (operation, params, cxt) => {
  const {
    performer: {
      dependents,
      type,
      code: {
        paths: {
          absolute: { folder }
        }
      }
    }
  } = params;

  if (type === "instanced") {
    const configFile = path.join(folder, "config.json");

    operation.print("out", "Watching config changes for " + configFile, cxt);

    builder(operation, params, cxt);

    const watcher = chokidar
      .watch(configFile, {
        ignoreInitial: true
      })
      .on("all", (event, path) => {
        operation.print("warning", "config.json changed...", cxt);

        operation
          .reset()
          .then(() => builder(operation, params, cxt))
          .catch(e => operation.print("warning", e.toString(), cxt));
      });

    while (operation.status !== "stop") {
      await wait(10);
    }

    operation.print("out", "Stop watchers...", cxt);
    watcher.close();
  }
};

const builder = (operation, params, cxt) => {
  const {
    performer: {
      type,
      code: {
        paths: {
          absolute: { folder }
        }
      }
    }
  } = params;

  operation.print("out", "Start building config...", cxt);

  Config.build(folder);

  operation.print("info", "Config generated: dist/config.json", cxt);
  operation.event("done");
};
