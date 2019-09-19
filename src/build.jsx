import _ from "lodash";
import fs from "fs-extra";
import path from "path";
import { exec, spawn, wait } from "@nebulario/core-process";
import { Operation, IO, Watcher, Performer } from "@nebulario/core-plugin-request";

import * as Config from "@nebulario/core-config";
import * as JsonUtil from "@nebulario/core-json";

export const clear = async (params, cxt) => {
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

  if (type === "instanced") {
    await Config.clear(folder);
  }
};

export const init = async (params, cxt) => {
  const {
    performers,
    performer,
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
    Performer.link(performer, performers, depPerformer => {
      if (depPerformer.module.type === "config") {
        IO.sendEvent(
          "info",
          {
            data: depPerformer.performerid + " config linked!"
          },
          cxt
        );

        Config.link(folder, moduleid);
      }
    });
    await Config.init(folder);
  }
};

export const start = (params, cxt) => {
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
    const configPath = path.join(folder, "config.json");

    const watcher = async (operation, cxt) => {
      const { operationid } = operation;

      await wait(100);

      IO.sendEvent(
        "out",
        {
          operationid,
          data: "Watching config changes for " + configPath
        },
        cxt
      );

      build(operation, params, cxt);
      const watcher = Watcher.watch(configPath, () => {
        IO.sendEvent(
          "info",
          {
            operationid,
            data: "config.json changed..."
          },
          cxt
        );

        build(operation, params, cxt);
      });

      while (operation.status !== "stopping") {
        await wait(100);
      }

      watcher.close();
      IO.sendEvent("stopped", {}, cxt);
    };

    return {
      promise: watcher,
      process: null
    };
  }
};

const build = (operation, params, cxt) => {
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

  const { operationid } = operation;

  IO.sendEvent(
    "out",
    {
      data: "Start building config..."
    },
    cxt
  );

  Config.build(folder);

  IO.sendEvent(
    "done",
    {
      data: "Config generated: dist/config.json"
    },
    cxt
  );
};
