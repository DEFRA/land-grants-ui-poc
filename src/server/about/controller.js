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
        viewModel,
        viewName
      } = this;
      return h.view('about', viewModel);
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