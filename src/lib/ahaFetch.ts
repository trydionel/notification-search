export const ahaFetch = (path: RequestInfo, options: RequestInit = {}) => {
  const { headers, ...rest } = options;
  const csrfToken = document.querySelector('meta[name=csrf-token]').getAttribute('content');

  return fetch(path, {
    credentials: 'same-origin',
    mode: 'cors',
    headers: {
      ...headers,
      'x-csrf-token': csrfToken
    },
    ...rest
  });
}