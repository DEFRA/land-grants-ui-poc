import { QuestionPageController } from "./QuestionPageController.js";
export class StartPageController extends QuestionPageController {
  /**
   * The controller which is used when Page["controller"] is defined as "./pages/start.js"
   * This page should not be used in production. This page is helpful for prototyping start pages within the app,
   * but start pages should really live on gov.uk (whitehall publisher) so a user can be properly signposted.
   */

  getViewModel(request, context) {
    return {
      ...super.getViewModel(request, context),
      isStartPage: true
    };
  }
}
//# sourceMappingURL=StartPageController.js.map