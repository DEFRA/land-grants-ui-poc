import * as Hoek from '@hapi/hoek';
import { config } from "../../config/index.js";
const partition = 'cache';
var ADDITIONAL_IDENTIFIER = /*#__PURE__*/function (ADDITIONAL_IDENTIFIER) {
  ADDITIONAL_IDENTIFIER["Confirmation"] = ":confirmation";
  return ADDITIONAL_IDENTIFIER;
}(ADDITIONAL_IDENTIFIER || {});

export class CacheService {
  /**
   * This service is responsible for getting, storing or deleting a user's session data in the cache. This service has been registered by {@link createServer}
   */
  cache;
  logger;
  constructor(server) {
    this.cache = server.cache({
      cache: 'session',
      segment: 'formSubmission'
    });
    this.logger = server.logger;
  }
  async getState(request) {
    const cached = await this.cache.get(this.Key(request));
    return cached || {};
  }
  async setState(request, state) {
    const key = this.Key(request);
    const ttl = config.get('sessionTimeout');
    await this.cache.set(key, state, ttl);
    return this.getState(request);
  }
  async getConfirmationState(request) {
    const key = this.Key(request, ADDITIONAL_IDENTIFIER.Confirmation);
    const value = await this.cache.get(key);
    return value || {};
  }
  async setConfirmationState(request, confirmationState) {
    const key = this.Key(request, ADDITIONAL_IDENTIFIER.Confirmation);
    const ttl = config.get('confirmationSessionTimeout');
    return this.cache.set(key, confirmationState, ttl);
  }
  async clearState(request) {
    if (request.yar.id) {
      await this.cache.drop(this.Key(request));
    }
  }

  /**
   * The key used to store user session data against.
   * If there are multiple forms on the same runner instance, for example `form-a` and `form-a-feedback` this will prevent CacheService from clearing data from `form-a` if a user gave feedback before they finished `form-a`
   * @param request - hapi request object
   * @param additionalIdentifier - appended to the id
   */
  Key(request, additionalIdentifier) {
    if (!request.yar.id) {
      throw Error('No session ID found');
    }
    return {
      segment: partition,
      id: `${request.yar.id}:${request.params.state ?? ''}:${request.params.slug ?? ''}:${additionalIdentifier ?? ''}`
    };
  }
}

/**
 * State merge helper
 * 1. Merges objects (form fields)
 * 2. Overwrites arrays
 */
export function merge(state, update) {
  return Hoek.merge(state, update, {
    mergeArrays: false
  });
}
//# sourceMappingURL=cacheService.js.map