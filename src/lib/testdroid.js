import { version } from '../../package.json';
import Debug from 'debug';
import { apiRequest } from './request';
import urljoin from 'url-join';
import util from 'util';
import Project from './project';
import { sleep } from './util';
import _ from 'lodash';

let debug = Debug('testdroid-client');
let CAPABILITY_LABEL_MAPPING = {
  'type'          : 'Codename',
  'build'         : 'Build Identifier',
  'sims'          : 'SIMs',
  'imei'          : 'IMEI',
  'phone_number'  : 'Phone Number',
  'memory'        : 'memory'
};

/**
 * Takes a list of capabilities for a device and returns back a label to value
 * mapping that can be translated into testdroid labels
 *
 * @param {Object} - capabilities - hash containing a list of device capabilities
 *
 * @returns {Object} - labels - Testdroid label grup name to label value mapping
 */
function mapCapabilitiesToLabels(capabilities) {
  let deviceCapabilities = _.clone(capabilities, true);
  let labels = {};
  // Special case where a label is a combination of two device capabilities
  if ('memory' in deviceCapabilities && 'build' in deviceCapabilities) {
    deviceCapabilities.build = `${deviceCapabilities.memory}_${deviceCapabilities.build}`;
    delete deviceCapabilities.memory;
  }
  for(let capability in deviceCapabilities) {
    if(!(capability in CAPABILITY_LABEL_MAPPING)) {
      throw new Error(`Invalid '${capability}' capability provided.`);
    }
    labels[CAPABILITY_LABEL_MAPPING[capability]] = deviceCapabilities[capability];
  }

  return labels;
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
    this.version = `testdroid-client/${version}`;
    this.baseUrl = url;
    this.apiUrl = urljoin(url+'api/v2/');
    this.username = username;
    this.password = password;
    this.token = {};
  }

  /**
   * Retrieves all devices.
   *
   * Optionally a filter can be supplied that will limit the devices returned. Currently
   * devices are filtered using label ids that are found within label groups.  Instead
   * of supplying these things, there is a set of common capabilities that a phone possesses
   * that can be specified directly and will be translated into the appropriate label
   * within testdroid.  Current capabilities are type, sims, build, imei, phone number.
   *
   * let filter = {
   *   'limit': 0,
   *   'type': 'Flame',
   *   'sims': '1',
   *   'build': 'http://path/to/flame-kk.zip'
   * }
   * testdroidClient.getDevices(filter);
   *
   * @param {Object} filter - Filter devices returned
   * @returns {Array}
   */
  async getDevices(filter={}) {
    let request = await apiRequest(this);
    let appliedFilter = {};
    appliedFilter.limit = filter.limit ? filter.limit : 0;

    let labels;
    try {
      labels = mapCapabilitiesToLabels(filter);
    }
    catch (e) {
      debug(e);
      return [];
    }

    let labelIds = [];
    for(let label in labels) {
      let labelId = await this.getLabelInGroup(labels[label], label);
      // If a label cannot be found, do not attempt to search for a device
      if (!labelId) { return []; }
      labelIds.push(labelId.id);
    }

    if (labelIds.length) appliedFilter['label_id[]'] = labelIds.join(',');
    let opts = { 'payload': appliedFilter};
    let response = await request.get('devices', opts);

    return response.body.data;
  }

  /**
   * Retrieves all devices matching a given name.
   * @param {String} deviceName - Name of the device
   * @return {Object} Device information
   */
  async getDevicesByName(deviceName) {
    let devices = await this.getDevices();

    let matchedDevices = devices.filter((device) => {
      return device.displayName === deviceName;
    });

    return matchedDevices;
  }

  /**
   * Get list of device properties
   *
   * @param {Object} device
   *
   * @returns {Array}
   */
  async getDeviceProperties(device) {
    let request = await apiRequest(this);
    let response = await request.get(`devices/${device.id}/properties?limit=0`);
    let properties = response.body.data || [];
    return properties;
  }

  /**
   * Gets a specific label group
   *
   * @param {String} labelName - Name of the label group
   *
   * @returns {Object}
   */
  async getLabelGroup(labelGroupName) {
    debug(`Retrieving ${labelGroupName} label group`);
    let request = await apiRequest(this);

    let search = {'search': labelGroupName};
    let response = await request.get('label-groups', {'payload': search});

    if (!response.ok) {
      let error = `Could not complete request to find label group. ${response.error.message}`;
      debug(error);
      throw new Error(error);
    }

    let labelMatch = response.body.data.find(
        l => l.displayName.toLowerCase() === labelGroupName.toLowerCase());
    if (!labelMatch) {
      debug(`Could not find a label group matching '${labelGroupName}'`);
    }
    return labelMatch;
  }

  /**
   * Gets all label groups
   *
   * @returns {Array}
   */
  async getLabelGroups() {
    debug(`Retrieving all label groups`);
    let request = await apiRequest(this);

    let response = await request.get('label-groups');

    if (!response.ok) {
      let error = `Could not complete request to find label groups. ${response.error.message}`;
      debug(error);
      throw new Error(error);
    }

    return response.body.data;
  }

  /**
   * Retrieves label within a specific label group.
   *
   * @param {String} labelName
   * @param {String} labelGroupName - Name of the group to find the label in
   *
   * @returns {Object}
   */
  async getLabelInGroup(label, labelGroupName) {
    debug(`Retrieving label '${label}' in label group '${labelGroupName}'`);
    let labelGroup = await this.getLabelGroup(labelGroupName);
    if (!labelGroup) return;

    let request = await apiRequest(this);

    let payload = { 'payload': { 'search': label } };
    let response = await request.get(`label-groups/${labelGroup.id}/labels`, payload);

    if (!response.ok) {
      let error = `Could not retrieve label. Error: ${response.error.message}`;
      debug(error);
      throw new Error(error);
    }

    let labelMatch = response.body.data.find(
      l => l.displayName.toLowerCase() === label.toLowerCase()
    );
    if (!labelMatch) { debug(`Could not find a label matching '${label}'`); }
    return labelMatch;
  }

  async getLabelslInGroup(labelGroupName) {
    let labels = [];
    debug(`Retrieving all labels in label group '${labelGroupName}'`);
    let labelGroup = await this.getLabelGroup(labelGroupName);
    if (!labelGroup) return labels;

    let request = await apiRequest(this);

    let response = await request.get(`label-groups/${labelGroup.id}/labels`);

    if (!response.ok) {
      let error = `Could not retrieve labels. Error: ${response.error.message}`;
      debug(error);
      throw new Error(error);
    }

    labels = response.body.data;

    return labels;
  }

  /**
   * Retrieves all user configured projects
   *
   * @param {Number} limit - Return only 'limit' entries. Default: all
   *
   * @return {Array} Array of Project instances
   */
  async getProjects(limit=0) {
    let request = await apiRequest(this);
    let response = await request.get('me/projects', {'payload': { 'limit': limit } });

    if (!response.ok) {
      let error = 'Could not retrieve projects.';
      debug(error);
      throw new Error(error);
    }

    if (!response.body.data.length) return [];

    let projects = response.body.data.map((project) => {
      return new Project(this, project);
    });

    return projects;
  }

  /**
   * Retrieves project with the given name
   *
   * @param {String} projectName
   *
   * @returns {Object} Project - new project instance
   */
  async getProject(projectName) {
    let request = await apiRequest(this);

    let response = await request.get('me/projects', {'payload': { 'search': projectName} });

    if (!response.ok) {
      let error = 'Could not retrieve projects.';
      debug(error);
      throw new Error(error);
    }

    // find exact match
    let project = response.body.data.find(
      p => p.name.toLowerCase() === projectName.toLowerCase());

    if (!project) return;

    return new Project(this, project);
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
    let request = await apiRequest(this);
    let opts = {
      'payload': {
        'type': type,
        'sessionId': sessionId
      }
    };

    let response;
    let maxRetries = 30;
    let queryFormat = "{\"type\":\"%s\", \"sessionId\": %d}";
    // Attempt to get a proxied adb/marionette connection.  Stop after 150 seconds
    for (let i = 1; i <= maxRetries; i++) {
      debug(`Creating proxied '${type}' session. Attempt ${i} of ${maxRetries}`);
      let encodedQuery = encodeURIComponent(util.format(queryFormat, type, sessionId));
      response = await request.get(`proxy-plugin/proxies?where=${encodedQuery}`);
      if (response.ok && response.body && response.body.length) break ;
      // Sleep for 5 seconds to give remote a chance to create proxied session
      await sleep(5000);
    }

    if (!response.ok || !response.body.length) {
      var error = `Could not get ${type} proxy session for ${sessionId}`;
      debug(error);
      throw new Error(error);
    }

    return response.body[0];
  }


  /**
   * Creates a device session for a particular device ID.
   *
   * @param {String} deviceId - ID of the device as returned by getDevices or getDeviceByName
   * @returns {Object} Information about the device session including session ID which is used elsewhere.
   */
  async startDeviceSession(deviceId) {
    debug("Creating a device session for '%s'", deviceId);
    let request = await apiRequest(this);
    let payload = { 'deviceModelId': deviceId };
    let response = await request.post('me/device-sessions', { 'payload': payload });

    if (!response.ok) {
      var error = `Could not create session for ${deviceId}. ${response.error.message}`;
      debug(error);
      throw new Error(error);
    }

    debug(`Started device session: Session ID: ${response.body.id}`);

    return response.body;
  }

  /**
   * Releases a device session so that it can be used by other clients.
   *
   * @param {String} sessionId - ID of the session to release
   */
  async stopDeviceSession(sessionId) {
    debug(`Stopping device session ${sessionId}`);
    let request = await apiRequest(this);
    let path = `me/device-sessions/${sessionId}/release`;
    let response = await request.post(path);

    if (!response.ok) {
      throw new Error(
        `Could not stop the session properly for ${sessionId}.  ${response.error.message}`
      );
    }

    return response;
  }
}
