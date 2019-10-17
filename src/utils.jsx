import _ from "lodash";
import fs from "fs";
import path from "path";
import { exec, spawn, wait } from "@nebulario/core-process";
import * as JsonUtils from "@nebulario/core-json";
import * as Performer from "@nebulario/core-performer";
import * as Config from "@nebulario/core-config";

export const linkDependents = (operation, performer, performers, cxt) => {
  const {
    code: {
      paths: {
        absolute: { folder }
      }
    },
    dependents,
    module: { dependencies }
  } = performer;
  const linkedPerformers = Performer.linked(performer, performers);

  const linked = Performer.linked(performer, performers, cxt)
    .filter(({ module: { type } }) => type === "config")
    .forEach(({ performerid, module: { moduleid } }) => {
      operation.print("info", performerid + " config linked!", cxt);
      Config.link(folder, moduleid);
    });
};

export const init = async (
  operation,
  { performer, performers, folders: { code: folder } },
  cxt
) => {
  linkDependents(operation, performer, performers, cxt);
  await Config.init(folder);
};
