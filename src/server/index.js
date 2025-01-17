import { Engine as CatboxMemory } from '@hapi/catbox-memory'
import hapi from '@hapi/hapi'
import inert from '@hapi/inert'
import Schmervice from '@hapipal/schmervice'
import path from 'path'
import { config } from '~/src/config/config.js'
import { catchAll } from '~/src/server/common/helpers/errors.js'
import { requestLogger } from '~/src/server/common/helpers/logging/request-logger.js'
import { pulse } from '~/src/server/common/helpers/pulse.js'
import { requestTracing } from '~/src/server/common/helpers/request-tracing.js'
import { secureContext } from '~/src/server/common/helpers/secure-context/index.js'
import { configureEnginePlugin } from '~/src/server/plugins/engine/index.js'
import pluginSession from '~/src/server/plugins/session.js'
import { CacheService } from '~/src/server/services/index.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { router } from './router.js'

export async function createServer(routeConfig) {
  const pluginEngine = await configureEnginePlugin(routeConfig)

  const server = hapi.server({
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: 'session',
        engine: new CatboxMemory()        
        // config.get('isTest')
        //   ? new CatboxMemory()
        //   : new CatboxRedis({
        //       client: buildRedisClient()
        //     })
      }
    ],
    state: {
      strictHeader: false
    }
  })
  // await server.register(pluginSession)
  // await server.register(pluginPulse)
  // await server.register(inert)
  // await server.register(Scooter)
  // await server.register(pluginBlankie)
  // await server.register(pluginCrumb)
  // await server.register(Schmervice)
  await server.register([
    requestLogger,
    inert,
    pluginSession,
    pluginEngine,
    requestTracing,
    secureContext,
    pulse,
    // sessionCache,
    nunjucksConfig,
    router, // Register all the controllers/routes defined in src/server/router.js
    Schmervice
  ])

  server.registerService(CacheService)
  server.ext('onPreResponse', catchAll)

  return server
}

/**
 * @import {Engine} from '~/src/server/common/helpers/session-cache/cache-engine.js'
 */
