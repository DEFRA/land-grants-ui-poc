/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 * @satisfies {Partial<ServerRoute>}
 */
export const homeController = {
  handler(_request, h) {
    const { cacheService } = _request.services([]);

    cacheService.updateState(_request, {userName: "test"});

    return h.redirect('/start');
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
