import { QuestionPageController } from "./QuestionPageController.js";
export class StatusPageController extends QuestionPageController {
  constructor(model, pageDef) {
    super(model, pageDef);
    this.viewName = 'confirmation';
  }
  getRelevantPath() {
    return this.getStatusPath();
  }
  makeGetRouteHandler() {
    return async (request, context, h) => {
      const {
        viewModel,
        viewName
      } = this;
      const {
        cacheService
      } = request.services([]);
      const confirmationState = await cacheService.getConfirmationState(request);

      // If there's no confirmation state, then
      // redirect the user back to the start of the form
      if (!confirmationState.confirmed) {
        return this.proceed(request, h, this.getStartPath());
      }
      const slug = request.params.slug;
      const {
        formsService
      } = this.model.services;
      const {
        getFormMetadata
      } = formsService;
      const {
        submissionGuidance
      } = await getFormMetadata(slug);
      return h.view(viewName, {
        ...viewModel,
        submissionGuidance
      });
    };
  }
}
//# sourceMappingURL=StatusPageController.js.map