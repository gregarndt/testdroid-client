import Debug from 'debug';
import { apiRequest } from './request';

let debug = Debug('testdroid-client:TestRun');

/**
 * Initializes a new test run object.
 *
 * @param {Object} client - Testdroid client instance
 * @param {Object} options - test run information as returned by the testdroid test run endpoint
 */
export default class {
  constructor(client, options) {
    if (arguments.length < 2) {
      throw new Error('Must supply testdroid client and test run configuration');
    }

    this.client = client;
    for (let option in options) {
      this[option] = options[option];
    }
    this.URI = `runs/${this.id}`;
  }

  /**
   * Aborts the test run
   *
   * @returns {Object} response object
   */
  async abort() {
    let request = await apiRequest(this.client);
    let response = await request.post(`${this.URI}/abort`);

    if (!response.ok) {
      throw new Error(response.error.message);
    }
    return response;
  }

  /**
   * Retrieves configuration for test run.
   *
   * @returns {Object}
   */
  async getConfig() {
    let request = await apiRequest(this.client);
    let response = await request.get(`${this.URI}/config`);

    if (!response.ok) {
      let error = (
        `Could not retrieve config for test run ${this.id} ` +
        `${response.error.message}`
      );
      debug(error);
      throw new Error(error);
    }

    return response.body.data;
  }

  /**
   * Retrieves test run configuration parameters.
   *
   * @returns {Object}
   */
  async getParameters() {
    let request = await apiRequest(this.client);
    let response = await request.get(`${this.URI}/config/parameters`);

    if (!response.ok) {
      let error = (
        `Could not retrieve config parameters for test run ${this.id} ` +
        `${response.error.message}`
      );
      debug(error);
      throw new Error(error);
    }

    return response.body.data;
  }

  /**
   * Starts a test run
   *
   * @param {Object} opts - Options for test run
   *
   * @returns {Object}
   */
  async start(opts) {
    debug('starting test run');
    let request = await apiRequest(this.client);
    var response = await request.post(`${this.URI}/start`, {'payload': opts});

    if (!response.ok) {
      let error = `Could not start run. ${response.error.message}`;
      debug(error);
      throw new Error(error);
    }
    debug('Test Run started');
    return response;
  }
}
