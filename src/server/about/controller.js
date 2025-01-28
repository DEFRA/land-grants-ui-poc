import { PageController } from '../plugins/engine/pageControllers/index.js';

/**
 * A GDS styled example about page controller.
 * @class AboutController
 */
export class AboutController extends PageController {
  /**
   * Creates an instance of AboutController.
   * @param {object} server - The server instance
   * @param {object} cacheService - The cache service instance
   */
  constructor(model, pageDef) {
    super(model, pageDef);
  }

  makeGetRouteHandler() {
    return (request, context, h) => {
      const {
        collection,
        model,
        viewName
      } = this;
      const {
        evaluationState
      } = context;

      const viewModel = this.getViewModel(request, context);
      return h.view('about', viewModel);
    };
  }

  makePostRouteHandler() {
    return async (request, context, h) => {
      const {
        collection,
        viewName
      } = this;
      const {
        isForceAccess,
        state
      } = context;

      /**
       * If there are any errors, render the page with the parsed errors
       * @todo Refactor to match POST REDIRECT GET pattern
       */
      if (context.errors || isForceAccess) {
        const viewModel = this.getViewModel(request, context);
        viewModel.errors = collection.getErrors(viewModel.errors);
        return h.view('about', viewModel);
      }

      // Save and proceed
      await this.setState(request, state);
      return this.proceed(request, h, this.getNextPath(context));
    };
  }


  /**
   * Main handler method for the controller
   * @param {object} request - The request object
   * @param {object} h - The response toolkit
   * @returns {object} Response
   */
  async handler(request, h) {
  }

  /**
   * Creates a route configuration object
   * @returns {object} Route configuration
   */
  static createRoute() {
    return {
      handler: (request, h) => {
        const controller = new AboutController(
          request.server,
          request.services([]).cacheService
        );
        return controller.handler(request, h);
      },
      options: {}
    };
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */