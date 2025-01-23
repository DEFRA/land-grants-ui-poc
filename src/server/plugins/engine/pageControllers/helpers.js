import { ControllerType, controllerNameFromPath, isControllerName } from '@defra/forms-model';
import { AboutController } from '~/src/server/about/controller.js';
import * as PageControllers from "./index.js";
export function isPageController(controllerName) {
  return isControllerName(controllerName) && controllerName in PageControllers;
}
/**
 * Creates page instance for each {@link Page} type
 */
export function createPage(model, pageDef) {
  const controllerName = controllerNameFromPath(pageDef.controller);
  if (!pageDef.controller) {
    return new PageControllers.QuestionPageController(model, pageDef);
  }

  // Patch legacy controllers
  if (controllerName && pageDef.controller !== controllerName) {
    pageDef.controller = controllerName;
  }
  let controller;
  switch (pageDef.controller) {
    case ControllerType.Start:
      controller = new PageControllers.StartPageController(model, pageDef);
      break;
    case ControllerType.Page:
      controller = new PageControllers.QuestionPageController(model, pageDef);
      break;
    case 'AboutController':
      controller = new AboutController(model, pageDef);
      break;
    case ControllerType.Terminal:
      controller = new PageControllers.TerminalPageController(model, pageDef);
      break;
    case ControllerType.Summary:
      controller = new PageControllers.SummaryPageController(model, pageDef);
      break;
    case ControllerType.Status:
      controller = new PageControllers.StatusPageController(model, pageDef);
      break;
    case ControllerType.FileUpload:
      controller = new PageControllers.FileUploadPageController(model, pageDef);
      break;
    case ControllerType.Repeat:
      controller = new PageControllers.RepeatPageController(model, pageDef);
      break;
  }
  if (typeof controller === 'undefined') {
    throw new Error(`Page controller ${pageDef.controller} does not exist`);
  }
  return controller;
}
//# sourceMappingURL=helpers.js.map