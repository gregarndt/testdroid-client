import '6to5/polyfill';
import { version } from '../../package.json';
import Debug from 'debug';
import request from 'superagent-promise';
import urljoin from 'url-join';
import util from 'util';

let debug = Debug('testdroid-client');

function sleep(duration) {
  return new Promise(function(accept) {
    setTimeout(accept, duration);
    });
}

/**
 * Initializes a new Testdroid client to be used with the Testdroid Cloud API.
 *
 * Examples:
 *
 * var Testdroid = require('testdroid-client');

 * var username = 'joe@example.com';
 * var password = '123456';
 * var cloudUrl = 'http://cloudurl/';

 * var client = new Testdroid(cloudUrl, username, password);

 * // Get list of devices

 * client.getDevices().then(function(devices) {
    console.dir(getDevices);
 * });
 *
 * @param {String} url - URL of the cloud api
 * @param {String} username
 * @param {String} password
 */
export default class {
  constructor(url, username, password) {
    this.version = version;
    this.baseUrl = url;
    this.apiUrl = url + 'api/v2/';
    this.username = username;
    this.password = password;
    this.userAgent = `testdroid-client/${this.version}`;
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
   * __request('get', '/devices', requestOptions);
   *
   * @param {String} method - method for the request.  'get' or 'post'
   * @param {String} path - endpoint to submit request to
   * @param {opts} opts - optional opts to include.  Maybe include payload and/or headers
   * @returns {Object} Response
   */
  async __request(method, path, opts) {
    let endpoint = urljoin(this.apiUrl, path);
    let payload = 'payload' in opts ? opts.payload : {};
    let headers = await this.buildHeaders(opts.headers);
    let r = request(method.toUpperCase(), endpoint);

    r.set(headers);

    if (method.toUpperCase() === 'GET') {
      r.query(payload);
    } else {
      r.send(payload);
    }

    var res = await r.end();
    debug(res);
    return res;
  }

  async buildHeaders(additionalHeaders) {
    let headers = typeof(additionalHeaders) !== 'undefined' ? additionalHeaders : {};
    let token = await this.getToken();
    headers.Authorization = `Bearer ${token}`;

    if (!('Accept' in headers)) {
      headers.Accept = 'application/json';
    }

    return headers;
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
  async get(path, opts) {
    opts = typeof(opts) !== 'undefined' ? opts : {};
    debug("Retrieving '/%s' with opts: %j", path, opts);
    let res = await this.__request('get', path, opts);

    if (!res.ok) {
      throw new Error(res.error);

    }

    return res.body;
  }

  /**
   * Retrieves all devices matching a given name.
   * @param {String} deviceName - Name of the device
   * @return {Object} Device information
   */
  async getDeviceByName(deviceName) {
    let devices = await this.getDevices();

    var device;
    for (var i=0; i < devices.length; i++) {
      if (devices[i].displayName === deviceName) {
        device = devices[i];
        break;
      }
    }
    return device;
  }

  /**
   * Retrieves all devices.
   * @param {Number} limit - number of devices to return
   * @returns {Array}
   */
  async getDevices(limit) {
    let deviceLimit = typeof(limit) !== 'undefined' ? limit : 0;
    let opts = { 'payload': { 'limit': deviceLimit }};
    let res = await this.get('devices', opts);
    return res.data;
  }

  /**
   * Creates proxy for adb and marionette commands.  ADB proxy will return
   * device information such as serial number as well as ADB host/port to use
   * for things like gaiatest (--adb-host option).  This operation can take up
   * to 120 seconds depending on how long the remote host takes to create a
   * proxy session.  Usually this is done within a second or two though.
   *
   * @param {String} type - 'adb' or 'marionette' proxy type
   * @param {String} sessionId - ID for the current session as returned by startDeviceSession
   * @returns {Object} Proxy session information
   */
  async getProxy(type, sessionId) {
    debug(`Creating ${type} proxied session`);
    let opts = {
      'payload': {
        'type': type,
        'sessionId': sessionId
      }
    };

    let res;
    let maxRetries = 30;
    // Attempt to get a proxied adb/marionette connection.  Stop after 150 seconds
    for (let i = 1; i <= maxRetries; i++) {
      debug(`Creating proxied '${type}' session. Attempt ${i} of ${maxRetries}`);
      res = await this.get('proxy-plugin/proxies', opts);
      if (res.length) break ;
      // Sleep for 2 seconds to give remote a chance to create proxied session
      await sleep(5000);
    }

    if (!res.length); {
      var err = `Could not get ${type} proxy session for ${sessionId}`;
      debug(err);
      throw new Error(err);
    }

    return res[0];
  }

  /**
   * Retrieves authorization token.  If client currently has token, then a refresh
   * will be done and new token returned.
   *
   * returns {String}
   */
  async getToken() {
    let authUrl = urljoin(this.baseUrl, 'oauth/token');
    let payload;
    if (!this.token || Date.now() > this.tokenExpiration) {
      debug('requesting new token');
      payload = {
        'client_id': 'testdroid-cloud-api',
        'grant_type': 'password',
        'username': this.username,
        'password': this.password
      };
    } else {
      // TODO only refresh if expiration is close?
      debug('refreshing token');
      payload = {
        'client_id': 'testdroid-cloud-api',
        'grant_type': 'refresh_token',
        'refresh_token': this.refreshToken
      };
    }

    let headers = {
      'User-Agent': this.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };

    let res = await request.post(authUrl)
                           .set(headers)
                           .send(payload)
                           .end();

    if (!res.ok) {
      throw new Error(
        `Could not retrieve token. Error Reponse: ${res.body.error_description}`
      );
    }

    this.refreshToken = res.body.refresh_token;
    this.token = res.body.access_token;
    this.tokenExpiration = new Date(Date.now() + res.body.expires_in);

    return res.body.access_token;
  }

  /**
   * Submits a post request to the cloud api with optional payload.
   *
   * @param {String} path - API endpoint to submit post request to.
   * @param {Object} opts - Payload to send
   * @returns {Object} Response
   */
  async post(path, opts) {
    let opts = typeof(opts) !== 'undefined' ? opts : {};
    debug("Submitting to %s with opts: %j", path, opts);
    opts.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    let res = await this.__request('post', path, opts);

    return res;
  }

  /**
   * Creates a device session for a particular device ID.
   *
   * @param {String} deviceId - ID of the device as returned by getDevices or getDeviceByName
   * @returns {Object} Information about the device session including session ID which is used elsewhere.
   */
  async startDeviceSession(deviceId) {
    debug("Creating a device session for '%s'", deviceId);
    let payload = { 'deviceModelId': deviceId };
    let res = await this.post('me/device-sessions', { 'payload': payload });

    if (!res.ok) {
      var err = `Could not create session for ${deviceId}. ${res.error.text}`;
      debug(err);
      throw new Error(err);
    }

    debug(`Started device session: Session ID: ${res.body.id}`);

    return res.body;
  }

  /**
   * Releases a device session so that it can be used by other clients.
   *
   * @param {String} sessionId - ID of the session to release
   */
  async stopDeviceSession(sessionId) {
    debug(`Stopping device session ${sessionId}`);
    let path = `me/device-sessions/${sessionId}/release`;
    let res = await this.post(path);

    if (!res.ok) {
      throw new Error(
        `Could not stop the session properly for ${sessionId}.  ${res.error}`
      );
    }

    return res;
  }

}

