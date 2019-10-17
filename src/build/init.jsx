import * as Utils from "../utils";

export const start = async (operation, params, cxt) => {
  const {
    payload,
    module: mod,
    performer,
    performer: {
      performerid,
      type,
      code: {
        paths: {
          absolute: { folder }
        }
      },
      dependents,
      module: { dependencies }
    },
    performers,
    task: { taskid }
  } = params;

  if (type === "instanced") {
    await Utils.init(
      operation,
      {
        performer,
        performers,
        folders: {
          code: folder
        }
      },
      cxt
    );
  }
};
