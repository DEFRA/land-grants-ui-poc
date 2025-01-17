import { join, parse } from 'node:path';
import { FormModel } from "./models/FormModel.js";
import { plugin } from "./plugin.js";
export const configureEnginePlugin = async ({
  formFileName,
  formFilePath
} = {}) => {
  let model;
  if (formFileName && formFilePath) {
    const definition = await getForm(join(formFilePath, formFileName));
    const {
      name
    } = parse(formFileName);
    model = new FormModel(definition, {
      basePath: name
    });
  }
  return {
    plugin,
    options: {
      model
    }
  };
};
export async function getForm(importPath) {
  const {
    ext
  } = parse(importPath);
  const attributes = {
    type: ext === '.json' ? 'json' : 'module'
  };
  const formImport = import(importPath, {
    with: attributes
  });
  const {
    default: definition
  } = await formImport;
  return definition;
}
//# sourceMappingURL=configureEnginePlugin.js.map