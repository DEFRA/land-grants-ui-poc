import { AboutController } from '~/src/server/about/controller.js';

export const aboutController = AboutController.createRoute();

/**
 * Sets up the routes used in the /about page.
 * These routes are registered in src/server/router.js.
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const about = {
  plugin: {
    name: 'about',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/forms/about',
          ...aboutController
        },
        {
          method: 'POST',
          path: '/forms/about',
          ...aboutController
        }
      ])
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
