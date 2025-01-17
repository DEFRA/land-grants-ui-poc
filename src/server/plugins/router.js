import { slugSchema } from '@defra/forms-model';
import Boom from '@hapi/boom';
import Joi from 'joi';
import { defaultConsent, parseCookieConsent, serialiseCookieConsent } from "../../common/cookies.js";
import { config } from "../../config/index.js";
import { isPathRelative } from "./engine/helpers.js";
import { getFormMetadata } from "./engine/services/formsService.js";
import { healthRoute, publicRoutes } from "../routes/index.js";
import { crumbSchema } from "../schemas/index.js";
const routes = [...publicRoutes, healthRoute];
export default {
  plugin: {
    name: 'router',
    register: server => {
      server.route(routes);

      // Shared help routes params schema & options
      const params = Joi.object().keys({
        slug: slugSchema
      }).required();
      const options = {
        validate: {
          params
        }
      };
      server.route({
        method: 'get',
        path: '/help/get-support/{slug}',
        async handler(request, h) {
          const {
            slug
          } = request.params;
          const form = await getFormMetadata(slug);
          return h.view('help/get-support', {
            form
          });
        },
        options
      });
      server.route({
        method: 'get',
        path: '/help/privacy/{slug}',
        async handler(request, h) {
          const {
            slug
          } = request.params;
          const form = await getFormMetadata(slug);
          return h.view('help/privacy-notice', {
            form
          });
        },
        options
      });
      server.route({
        method: 'get',
        path: '/help/cookies/{slug}',
        handler(_request, h) {
          return h.view('help/cookies', {
            googleAnalyticsContainerId: config.get('googleAnalyticsTrackingId').replace(/^G-/, '')
          });
        },
        options
      });
      server.route({
        method: 'post',
        path: '/help/cookie-preferences/{slug}',
        handler(request, h) {
          const {
            params,
            payload,
            query
          } = request;
          const {
            slug
          } = params;
          let {
            returnUrl
          } = query;
          if (returnUrl && !isPathRelative(returnUrl)) {
            throw Boom.badRequest('Return URL must be relative');
          }
          const analyticsDecision = (payload['cookies[analytics]'] ?? '').toLowerCase();
          const dismissedDecision = (payload['cookies[dismissed]'] ?? '').toLowerCase();

          // move the parser into our JS code so we can delegate to the frontend in a future iteration
          let cookieConsent;
          if (typeof request.state.cookieConsent === 'string') {
            cookieConsent = parseCookieConsent(request.state.cookieConsent);
          } else {
            cookieConsent = defaultConsent;
          }
          if (analyticsDecision) {
            cookieConsent.analytics = analyticsDecision === 'yes';
            cookieConsent.dismissed = false;
          }
          if (dismissedDecision) {
            cookieConsent.dismissed = dismissedDecision === 'yes';
          }
          if (!returnUrl) {
            cookieConsent.dismissed = true; // this page already has a confirmation message, don't show another
            returnUrl = `/help/cookie-preferences/${slug}`;
          }
          const serialisedCookieConsent = serialiseCookieConsent(cookieConsent);
          h.state('cookieConsent', serialisedCookieConsent);
          return h.redirect(returnUrl);
        },
        options: {
          validate: {
            params,
            payload: Joi.object({
              crumb: crumbSchema,
              'cookies[analytics]': Joi.string().valid('yes', 'no').optional(),
              'cookies[dismissed]': Joi.string().valid('yes', 'no').optional()
            }),
            query: Joi.object({
              returnUrl: Joi.string().optional()
            })
          }
        }
      });
      server.route({
        method: 'get',
        path: '/',
        handler() {
          throw Boom.notFound();
        }
      });
      server.route({
        method: 'get',
        path: '/help/cookie-preferences/{slug}',
        handler(request, h) {
          const {
            params
          } = request;
          const {
            slug
          } = params;
          let cookieConsentDismissed = false;
          if (typeof request.state.cookieConsent === 'string') {
            const cookieConsent = parseCookieConsent(request.state.cookieConsent);
            cookieConsentDismissed = cookieConsent.dismissed;
          }

          // if the user has come back to this page after updating their preferences
          // override the 'dismissed' behaviour to show a success notification instead of
          // the cookie banner
          const showConsentSuccess = cookieConsentDismissed && request.info.referrer.endsWith(`/help/cookie-preferences/${slug}`);
          return h.view('help/cookie-preferences', {
            cookieConsentUpdated: showConsentSuccess
          });
        },
        options
      });
      server.route({
        method: 'get',
        path: '/help/accessibility-statement/{slug}',
        handler(_request, h) {
          return h.view('help/accessibility-statement');
        },
        options
      });
    }
  }
};
//# sourceMappingURL=router.js.map