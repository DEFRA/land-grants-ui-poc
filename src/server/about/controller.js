import { getAnswer } from '../plugins/engine/components/helpers.js';

/**
 * A GDS styled example about page controller.
 * Provided as an example, remove or modify as required.
 * @satisfies {Partial<ServerRoute>}
 */
export const aboutController = {
  handler: async (request, h) => {
    const { cacheService } = request.services([]);

    try {
      const cacheKey = cacheService.Key(request);

      request.params = request.params || {};
      request.params.slug = request.params.slug || 'forms';
      request.params.state = request.params.state || '';

      const state = await cacheService.getState(request);
      const model = request.server.app.model;

      const confirmationState = await cacheService.getConfirmationState(request);

      const context = {
        relevantPages: model.pages,
        relevantState: state,
        state,
        isForceAccess: false
      };

      return h.view('about/index', {
        pageTitle: 'About',
        heading: 'About',
        debug: {
          cacheKey,
          state,
          confirmationState,
          sessionId: request.yar?.id,
          params: request.params
        },
        checkAnswers: [{
          summaryList: {
            rows: context.relevantPages
              .filter(p => p.constructor.name === 'QuestionPageController')
              .flatMap(page => page.collection.fields.map(field => ({
                key: { text: field.title },
                value: { 
                  classes: 'app-prose-scope',
                  html: getAnswer(field, state) || 'Not supplied'
                },
                actions: {
                  items: [{
                    href: page.path,
                    text: 'Change',
                    classes: 'govuk-link--no-visited-state',
                    visuallyHiddenText: field.title
                  }]
                }
              })))
          }
        }],
        context,
        breadcrumbs: [
          { text: 'Home', href: '/' },
          { text: 'About' }
        ]
      });

    } catch (error) {
      console.error("Cache error:", error);
      throw error;
    }
  }
};

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
