import Debug from 'debug';
import Request from './request';

let debug = Debug('testdroid-client:auth');

/**
 * Retrieves authorization token.  If client currently has token, then a refresh
 * will be done and new token returned.
 *
 * returns {Object}
 */
export default async function (client) {
  let token = client.token;
  let request = new Request.Request(client.baseUrl, client.version);
  let payload;
  if (!Object.keys(token).length || Date.now() > token.expiration) {
    debug('requesting new token');
    payload = {
      'client_id': 'testdroid-cloud-api',
      'grant_type': 'password',
      'username': client.username,
      'password': client.password
    };
  } else {
    // only refresh if within 1 minute
    if (token.expiration > (Date.now()+60000)) {
      debug('no need to refresh token');
      return token;
    }
    debug('refreshing token');
    payload = {
      'client_id': 'testdroid-cloud-api',
      'grant_type': 'refresh_token',
      'refresh_token': token.refreshToken
    };
  }

  let response = await request.post('oauth/token', {'payload': payload})

  if (!response.ok) {
    throw new Error(
      `Could not retrieve token. Error Reponse: ${response.body.error_description}`
    );
  }

  token = {
    refreshToken: response.body.refresh_token,
    token: response.body.access_token,
    expiration: new Date(Date.now() + (response.body.expires_in * 1000))
  };

  return token;
}
