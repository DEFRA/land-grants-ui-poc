import { getAnswer } from '../plugins/engine/components/helpers.js';

/**
 * A GDS styled example about page controller.
 * @class AboutController
 */
export class AboutController {
  /**
   * Creates an instance of AboutController.
   * @param {object} server - The server instance
   * @param {object} cacheService - The cache service instance
   */
  constructor(server, cacheService) {
    this.server = server;
    this.cacheService = cacheService;

    // Extend server functionality so Custom Form entries can be passed through DXT's SummaryPageController to our summary view.
    this.extendServer();
  }

  extendServer() {
    this.server.ext('onPreResponse', async (request, h) => {
      if (request.path === '/forms/summary') {
        const response = request.response;
        if (response.variety === 'view') {
          const state = await this.cacheService.getState(request);
          if (state?.customSummaryEntries) {
            if (!response.source.context.checkAnswers) {
              response.source.context.checkAnswers = [];
            }
            
            // Only add entries that don't already exist
            const existingKeys = new Set(
              response.source.context.checkAnswers
                .flatMap(section => section.summaryList.rows)
                .map(row => row.key.text)
            );

            const newEntries = state.customSummaryEntries.filter(entry => {
              const entryKeys = entry.summaryList.rows.map(row => row.key.text);
              return !entryKeys.some(key => existingKeys.has(key));
            });

            response.source.context.checkAnswers.push(...newEntries);
          }
        }
      }
      return h.continue;
    });
  }

  /**
   * Generates the check answers summary list
   * @private
   * @param {object} model - The application model
   * @param {object} state - The current state
   * @returns {Array} Check answers configuration
   */
  _generateCheckAnswers(model, state) {
    return [{
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
  }

  /**
   * Generates the view model for the about page
   * @private
   * @param {object} checkAnswers - The check answers configuration
   * @param {object} [errorMessage] - Optional error message
   * @returns {object} View model
   */
  _generateViewModel(checkAnswers, errorMessage = null) {
    const viewModel = {
      pageTitle: 'About',
      heading: 'About',
      checkAnswers,
      breadcrumbs: [
        { text: 'Home', href: '/' },
        { text: 'About' }
      ]
    };

    if (errorMessage) {
      viewModel.errorMessage = errorMessage;
    }

    return viewModel;
  }

  /**
   * Handles POST requests
   * @private
   * @param {object} request - The request object
   * @param {object} h - The response toolkit
   * @param {object} checkAnswers - The check answers configuration
   * @returns {object} Response
   */
  async _handlePost(request, h, checkAnswers) {
    const payload = request.payload;

    if (!payload.userName) {
      return h.view('about/index', this._generateViewModel(checkAnswers, {
        text: "Please enter a name"
      }));
    }

    // Store both the user input and the formatted summary list entry
    await this.cacheService.updateState(request, { 
      userName: payload.userName,
      customSummaryEntries: [{
        summaryList: {
          rows: [{
            key: { text: 'User Name' },
            value: { 
              classes: 'app-prose-scope',
              html: payload.userName
            },
            actions: {
              items: [{
                href: '/forms/about',
                text: 'Change',
                classes: 'govuk-link--no-visited-state',
                visuallyHiddenText: 'User Name'
              }]
            }
          }]
        }
      }]
    });

    return h.redirect('/forms/summary');
  }

  /**
   * Handles GET requests
   * @private
   * @param {object} h - The response toolkit
   * @param {object} checkAnswers - The check answers configuration
   * @returns {object} Response
   */
  _handleGet(h, checkAnswers) {
    globalThis.items = [];
    return h.view('about/index', this._generateViewModel(checkAnswers));
  }

  /**
   * Main handler method for the controller
   * @param {object} request - The request object
   * @param {object} h - The response toolkit
   * @returns {object} Response
   */
  async handler(request, h) {
    try {
      // Initialize parameters
      request.params = request.params || {};
      request.params.slug = request.params.slug || 'forms';
      request.params.state = request.params.state || '';

      const state = await this.cacheService.getState(request);
      const model = this.server.app.model;
      
      // Get the first question page and its fields
      const firstQuestionPage = model.pages.find(p => p.constructor.name === 'QuestionPageController');
      const fields = firstQuestionPage.collection.fields;
      
      // Generate check answers configuration
      const checkAnswers = this._generateCheckAnswers(model, state);

      // Handle request based on method
      return request.method === 'post' 
        ? await this._handlePost(request, h, checkAnswers)
        : this._handleGet(h, checkAnswers);

    } catch (error) {
      console.error("Cache error:", error);
      throw error;
    }
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
      options: {
        pre: [{
          method: async (request, h) => {
            const cacheService = request.services([]).cacheService;
            const state = await cacheService.getState(request);
            
            // Add the customSummaryEntries to the view context
            request.pre.customSummaryEntries = state?.customSummaryEntries || [];
            
            return h.continue;
          },
          assign: 'customEntries'
        }]
      }
    };
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */