import req from 'superagent-promise';
import urljoin from 'url-join';
import Debug from 'debug';
import getToken from './auth.js';

let debug = Debug('testdroid-client:request');


export async function apiRequest(client) {
  client.token = await getToken(client);
  return new Request(client.apiUrl, client.version, client.token.token);
}

export class Request {
  constructor(url, userAgent, token={}) {
    this.url = url;
    this.userAgent = userAgent;
    this.token = token;
  }

  /**
   * Submits a request to the api endpoint.  Options can be passed in for payload and
   * additional headers.
   *
   * Example options:
   * var requestOptions = {
   *   'headers': {
   *     'x-user': 'foo'
   *    },
   *    'payload': {
   *      'limit': 1
   *    }
   * };
   *
   * request('get', '/devices', requestOptions);
   *
   * @param {String} method - method for the request.  'get' or 'post'
   * @param {String} path - endpoint to submit request to
   * @param {opts} opts - optional opts to include.  Maybe include payload and/or headers
   * @returns {Object} response
   */
  async request(method, path, opts={}) {
    let endpoint = urljoin(this.url, path);
    let payload = 'payload' in opts ? opts.payload : {};
    let headers = this.buildHeaders(opts.headers);
    let apiRequest = req(method.toUpperCase(), endpoint);

    apiRequest.set(headers);

    if (method.toUpperCase() === 'GET') {
      apiRequest.query(payload);
    } else {
      apiRequest.send(payload);
    }
    let response;
    try {
      response = await apiRequest.end();
    }
    catch (error) {
      debug(`Could not complete the request. ${error}`);
      throw new Error(error);
    }

    return response;
  }

  /**
   * Creates headers for request.  Main purpose here is to inject the auth token
   * into the headers for each reqeust.
   *
   * @param {Object} headers - Additional headers to be included
   *
   * @returns {Object}
   */
  buildHeaders(headers={}) {
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    if (!('Accept' in headers)) {
      headers.Accept = 'application/json';
    }

    headers['User-Agent'] = this.userAgent;

    return headers;
  }

  /**
   * Sends a delete request
   *
   * @param {String} path
   *
   * @returns {Object}
   */
  async del(path) {
    debug("Deleting '/%s'", path);
    let response = await this.request('delete', path);

    return response;
  }

  /**
   * Submits a get request to the cloud api with optional query string.  Query
   * parameters are supplied in the payload of the options passed in.
   *
   * Payload may container either an object to be serialized into a query string
   * or the query string itself.
   *
   * Examples:
   * // Get request using payload as object
   * client.get('/devices', { 'payload': { 'limit': 1 } });
   *
   * @param {String} path - API endpoint to submit post request to.
   * @param {Object} opts - Payload to send.
   * * @returns {Object} Response
   */
  async get(path, opts={}) {
    debug("Retrieving '/%s' with opts: %j", path, opts);
    let response = await this.request('get', path, opts);

    return response;
  }

  /**
   * Submits a post request to the cloud api with optional payload.
   *
   * @param {String} path - API endpoint to submit post request to.
   * @param {Object} opts - Payload to send
   * @returns {Object} Response
   */
  async post(path, opts={}) {
    debug(`Submitting to ${path}`);
    opts.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    let response = await this.request('post', path, opts);

    return response;
  }
}
