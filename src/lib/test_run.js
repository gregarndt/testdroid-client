import Debug from 'debug';

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
    let res = await this.client.post(`${this.URI}/abort`);

    if (!res.ok) {
      throw new Error(res.error.message);
    }
    return res;
  }

  /**
   * Retrieves configuration for test run.
   *
   * @returns {Object}
   */
  async getConfig() {
    let res = await this.client.get(`${this.URI}/config`);

    if (!res.ok) {
      let err = (
        `Could not retrieve config for test run ${this.id} ` +
        `${res.error.message}`
      );
      debug(err);
      throw new Error(err);
    }

    return res.body.data;
  }

  /**
   * Retrieves test run configuration parameters.
   *
   * @returns {Object}
   */
  async getParameters() {
    let res = await this.client.get(`${this.URI}/config/parameters`);

    if (!res.ok) {
      let err = (
        `Could not retrieve config parameters for test run ${this.id} ` +
        `${res.error.message}`
      );
      debug(err);
      throw new Error(err);
    }

    return res.body.data;
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
    var res = await this.client.post(`${this.URI}/start`, {'payload': opts});

    if (!res.ok) {
      let err = `Could not start run. ${res.error.message}`;
      debug(err);
      throw new Error(err);
    }
    debug('Test Run started');
    return res;
  }
}
