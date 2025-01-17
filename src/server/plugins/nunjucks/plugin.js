import vision from '@hapi/vision';
import nunjucks from 'nunjucks';
import { config } from "../../../config/index.js";
import { context } from "./context.js";
import { environment, paths } from "./environment.js";

/**
 * @type {ServerRegisterPluginObject<ServerViewsConfiguration>}
 */
export const plugin = {
  plugin: vision,
  options: {
    engines: {
      html: {
        /**
         * @param {string} path
         * @param {{ environment: typeof environment }} compileOptions
         * @returns {(options: ReturnType<Awaited<typeof context>>) => string}
         */
        compile(path, compileOptions) {
          return options => nunjucks.compile(path, compileOptions.environment).render(options);
        }
      }
    },
    path: paths,
    compileOptions: {
      environment
    },
    isCached: config.get('isProduction'),
    context
  }
};

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 * @import { ServerViewsConfiguration } from '@hapi/vision'
 */
//# sourceMappingURL=plugin.js.map