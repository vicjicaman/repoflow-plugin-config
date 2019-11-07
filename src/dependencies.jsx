import _ from "lodash";
import * as Config from "@nebulario/core-config";
import * as JsonUtils from "@nebulario/core-json";

export const list = async (
  {
    module: {
      fullname,
      code: {
        paths: {
          absolute: { folder }
        }
      }
    }
  },
  cxt
) => {
  return Config.dependencies(folder);
};

export const sync = async (
  {
    module: {
      code: {
        paths: {
          absolute: { folder }
        }
      }
    },
    dependency: { kind, filename, path, version }
  },
  cxt
) => {
  if (version) {
    JsonUtils.sync(folder, {
      filename,
      path,
      version
    });
  }

  return {};
};
