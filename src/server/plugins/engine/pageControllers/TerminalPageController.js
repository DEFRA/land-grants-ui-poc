import Boom from '@hapi/boom';
import { QuestionPageController } from "./QuestionPageController.js";
export class TerminalPageController extends QuestionPageController {
  makePostRouteHandler() {
    throw Boom.methodNotAllowed('POST method not allowed for terminal pages');
  }
}
//# sourceMappingURL=TerminalPageController.js.map