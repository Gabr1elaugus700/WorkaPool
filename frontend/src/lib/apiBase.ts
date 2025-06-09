export function getBaseUrl() {
  const isLocal =
    /^192\.168\.0\./.test(window.location.hostname) ||
    window.location.hostname === 'localhost';

  return isLocal
    ? `http://${window.location.hostname}:3005`
    : 'http://pooltecnica.no-ip.biz:3005';
}
