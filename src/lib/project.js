import Debug from 'debug';
import util from 'util';
import TestRun from './test_run';

let debug = Debug('testdroid-client:Project');

/**
 * Initializes a new project object.
 *
 * @param {Object} client - Testdroid client instance
 * @param {Object} options - project information as returned by the testdroid project endpoint
 */
export default class {
  constructor(client, options) {
    if (arguments.length < 2) {
      throw new Error('Must supply testdroid client and project configuration');
    }

    this.client = client;
    for (let option in options) {
      this[option] = options[option];
    }
    this.URI = `me/projects/${this.id}`;
  }

  /**
   * Create a test run within the project
   *
   * @returns {Object} Test run
   */
  async createTestRun() {
    let payload = { projectId: this.id };
    let res = await this.client.post('/runs', { payload: payload });

    if (!res.ok) {
      let err = `Could not create a test run in '${this.name}'. ${res.error.message}`;
      debug(err);
      throw new Error(err);
    }

    return new TestRun(this.client, res.body);
  }

  /**
   * Creates test run parameter
   *
   * @param {Object} testRun - TestRun instance
   * @param {Object} parameter - parameter to create
   *
   * @returns {Object}
   */
  async createTestRunParameter(testRun, parameter) {
    debug(`Creating testrun param '${parameter.key}' for test run '${testRun.id}'`);
    let res = await this.client.post(`${this.URI}/runs/${testRun.id}/config/parameters`, {'payload': parameter});

    if (!res.ok) {
      let err = `Could not create param '${util.inspect(parameter)}'. ${res.error.message}`;
      debug(err);
      throw new Error(err);
    }

    return res.body;
  }

  /**
   * Deletes test run parameter
   *
   * @param {Object} testRun - TestRun instance
   * @param {Object} parameter - parameter to delete
   */
  async deleteTestRunParameter(testRun, parameter) {
    debug(`Deleting param '${parameter.key}' for test run '${testRun.id}'`);
    let res = await this.client.del(`${this.URI}/runs/${testRun.id}/config/parameters/${parameter.id}`);

    if (!res.ok) {
      let err = `Could not delete param '${parameter.key}'. ${res.error.message}`;
      debug(err);
      throw new Error(err);
    }

    return;
  }

  /**
   * Retrieves a test run configuration within a project.
   *
   * @param {Object} testRun
   *
   * @returns {Object}
   */
  async getTestRunConfig(testRun) {
    let res = await this.client.get(`${this.URI}/runs/${testRun.id}/config`);

    if (!res.ok) {
      let err = (
        `Could not retrieve test run ${testRun.id} in project ${this.name}. ` +
        `${res.error.message}`
      );
      debug(err);
      throw new Error(err);
    }

    return res.body;
  }

  /**
   * Retrieves a test run configuration within a project.
   *
   * @param {Object} testRun - TestRun instance
   *
   * @returns {Object} - new TestRun instance
   */
  async getTestRun(testRun) {
    let res = await this.client.get(`${this.URI}/runs/${testRun.id}`);

    if (!res.ok) {
      let err = (
        `Could not retrieve test run ${testRun.id} in project ${this.name}. ` +
        `${res.error.message}`
      );
      debug(err);
      throw new Error(err);
    }

    return new TestRun(this.client, res.body);
  }

}
