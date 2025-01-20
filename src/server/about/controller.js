import { getAnswer } from '../plugins/engine/components/helpers.js';

/**
 * A GDS styled example about page controller.
 * Provided as an example, remove or modify as required.
 * @satisfies {Partial<ServerRoute>}
 */
export const aboutController = {
  handler: async (request, h, context) => {
    const { cacheService } = request.services([]);
    const method = request.method;
    try {
      const cacheKey = cacheService.Key(request);

      request.params = request.params || {};
      request.params.slug = request.params.slug || 'forms';
      request.params.state = request.params.state || '';

      const state = await cacheService.getState(request);
      const model = request.server.app.model;

      const checkAnswers = [{
        summaryList: {
          rows: model.pages
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
      }];

    if (method === 'post') {
      const payload = request.payload;

      if (!payload.userName) {
        return h.view('about/index', {
          pageTitle: 'About',
          heading: 'About',
          checkAnswers,
          errorMessage: {
            text: "Please enter a name"
          },
          breadcrumbs: [
            { text: 'Home', href: '/' },
            { text: 'About' }
          ]
        });
      }

      cacheService.updateState(request, {userName: payload.userName});
      
      // we need to find a way to push external form items to SummaryViewModel - this is just a hack for the POC
      globalThis.items = [{
        name: "userName",
        title: 'User Name',
        value: payload.userName,
      }]
          

      return h.redirect('/forms/summary');
    } else {
      globalThis.items = [];
    }

      return h.view('about/index', {
        pageTitle: 'About',
        heading: 'About',
        checkAnswers,
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
