import Wreck from '@hapi/wreck';
export const request = async (method, url, options) => {
  const {
    res,
    payload
  } = await Wreck[method](url, options);
  if (!res.statusCode || res.statusCode < 200 || res.statusCode > 299) {
    return {
      res,
      error: payload || new Error('Unknown error')
    };
  }
  return {
    res,
    payload
  };
};
export const get = (url, options) => {
  return request('get', url, options);
};
export const getJson = url => {
  return get(url, {
    json: true
  });
};
export const post = (url, options) => {
  return request('post', url, options);
};
export const postJson = (url, options) => {
  return post(url, {
    ...options,
    json: true
  });
};
export const put = (url, options) => {
  return request('put', url, options);
};
//# sourceMappingURL=httpService.js.map