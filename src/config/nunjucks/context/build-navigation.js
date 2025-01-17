/**
 * @param {Partial<Request> | null} request
 */
export function buildNavigation(request) {
  return [
    {
      text: 'Home',
      url: '/',
      isActive: request?.path === '/'
    },
    {
      text: 'About',
      url: '/forms/about',
      isActive: request?.path === '/about'
    }
  ]
}

/**
 * @import { Request } from '@hapi/hapi'
 */
