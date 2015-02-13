import Debug from 'debug';
import util from 'util';
import TestRun from './test_run';
import { apiRequest } from './request';

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
    let request = await apiRequest(this.client);
    let payload = { projectId: this.id };
    let response = await request.post('/runs', { payload: payload });

    if (!response.ok) {
      let error = `Could not create a test run in '${this.name}'. ${response.error.message}`;
      debug(error);
      throw new Error(error);
    }

    return new TestRun(this.client, response.body);
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
    let request = await apiRequest(this.client);
    debug(`Creating testrun param '${parameter.key}' for test run '${testRun.id}'`);
    let uri = `${this.URI}/runs/${testRun.id}/config/parameters`;
    let response = await request.post(uri, {'payload': parameter});

    if (!response.ok) {
      let error = `Could not create param '${util.inspect(parameter)}'. ${response.error.message}`;
      debug(error);
      throw new Error(error);
    }

    return response.body;
  }

  /**
   * Deletes test run parameter
   *
   * @param {Object} testRun - TestRun instance
   * @param {Object} parameter - parameter to delete
   */
  async deleteTestRunParameter(testRun, parameter) {
    debug(`Deleting param '${parameter.key}' for test run '${testRun.id}'`);
    let request = await apiRequest(this.client);
    let uri = `${this.URI}/runs/${testRun.id}/config/parameters/${parameter.id}`;
    let response = await request.del(uri);

    if (!response.ok) {
      let error = `Could not delete param '${parameter.key}'. ${response.error.message}`;
      debug(error);
      throw new Error(error);
    }
  }

  /**
   * Retrieves a test run configuration within a project.
   *
   * @param {Object} testRun
   *
   * @returns {Object}
   */
  async getTestRunConfig(testRun) {
    let request = await apiRequest(this.client);
    let response = await request.get(`${this.URI}/runs/${testRun.id}/config`);

    if (!response.ok) {
      let error = (
        `Could not retrieve test run ${testRun.id} in project ${this.name}. ` +
        `${response.error.message}`
      );
      debug(error);
      throw new Error(error);
    }

    return response.body;
  }

  /**
   * Retrieves a test run configuration within a project.
   *
   * @param {Object} testRun - TestRun instance
   *
   * @returns {Object} - new TestRun instance
   */
  async getTestRun(testRun) {
    let request = await apiRequest(this.client);
    let response = await request.get(`${this.URI}/runs/${testRun.id}`);

    if (!response.ok) {
      let error = (
        `Could not retrieve test run ${testRun.id} in project ${this.name}. ` +
        `${response.error.message}`
      );
      debug(error);
      throw new Error(error);
    }

    return new TestRun(this.client, response.body);
  }

}
