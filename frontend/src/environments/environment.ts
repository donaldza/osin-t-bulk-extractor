export const environment = {
  production: true,
  apiUrl: location.port === '4201' ? 'http://localhost:8000' : '/bulk-extractor-api',
  wsUrl: location.port === '4201'
    ? 'ws://localhost:8000'
    : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/bulk-extractor-api`,
};
