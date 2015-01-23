import '6to5/polyfill';
import { version } from '../../package.json';
import Debug from 'debug';
import request from 'superagent-promise';
import url from 'url';
import util from 'util';

let debug = Debug('testdroid-client');

function sleep(duration) {
  return new Promise(function(accept) {
    setTimeout(accept, duration);
    });
}

export default class {
  constructor(url, username, password) {
    this.version = version;
    this.baseUrl = url;
    this.apiUrl = url + 'api/v2/';
    this.username = username;
    this.password = password;
    this.userAgent = `testdroid-client/${this.version}`;
  }

  async __request(method, path, opts) {
    let endpoint = url.resolve(this.apiUrl, path);
    let payload = 'payload' in opts ? opts.payload : {};
    let headers = await this.buildHeaders(opts.headers);
    let r = request(method.toUpperCase(), endpoint);

    r.set(headers);

    if (method.toUpperCase() === 'GET') {
      r.query(payload);
    } else {
    r.send(payload);
    }

    return r.end();
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

  async get(path, opts) {
    debug("Retrieving '/%s' with opts: %j", path, opts);
    let res = await this.__request('get', path, opts);

    if (!res.ok) {
      throw new Error(res.error);

    }

    return res.body;
  }

  async getDevices(limit) {
    let deviceLimit = typeof(limit) !== 'undefined' ? limit : 0;
    let opts = { 'payload': { 'limit': deviceLimit }};
    let res = await this.get('devices', opts);
    return res.data;
  }

  async getProxy(type, sessionId) {
    debug(`Creating ${type} proxied session`);
    let opts = {
      'payload': {
        'type': type,
        'sessionId': sessionId
      }
    };

    let res;
    let maxRetries = 60;
    // Attempt to get a proxied adb/marionette connection.  Stop after 120 seconds
    for (var i = 0; i < maxRetries; i++) {
      debug(`Creating proxied '${type}' session. Attempt ${i} of ${maxRetries}`);
      res = await this.get('proxy-plugin/proxies', opts);
      if (res.length) break ;
      await sleep(2000);
    }

    if (!res) {
      throw new Error('Could not get proxied session');
    }

    return res[0];
  }

  async getToken() {
    let authUrl = url.resolve(this.baseUrl, 'oauth/token');
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
      // TODO only refresh if expiration is close (10 seconds?)
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

  async post(path, opts) {
    let opts = typeof(opts) !== 'undefined' ? opts : {};
    debug("Submitting to %s with opts: %j", path, opts);
    opts.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    let res = await this.__request('post', path, opts);

    if (!res.ok) {
      throw new Error(res.error);
    }

    return res;
  }

  async startDeviceSession(deviceId) {
    debug("Creating a device session for '%s'", deviceId);
    let payload = { 'deviceModelId': deviceId };
    let res = await this.post('me/device-sessions', { 'payload': payload });

    debug(`Started device session: Session ID: ${res.body.id}`);

    return res.body.id;
  }

  async stopDeviceSession(sessionId) {
    debug(`Stopping device session ${sessionId}`);
    let path = `me/device-sessions/${sessionId}/release`;
    let res = await this.post(path);

    return res;
  }

}

