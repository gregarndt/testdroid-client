import Testdroid from 'testdroid-client';
import util from 'util';
import { sleep } from '../lib/util';
import { parser } from './credentialParser';

parser.addArgument(
  ['-b', '--build-url'],
  {
    help: 'URL for the flame-kk.zip build file',
    required: true
  }
);
parser.addArgument(
  ['-m', '--memory'],
  {
    help: 'Memory configuration required (e.g. 319, 512)',
    required: true
  }
);
parser.addArgument(
  ['-d', '--type'],
  {
    help: 'device type',
    required: true
  }
);

parser.addArgument(
  ['-s', '--sims'],
  {
    help: 'number of sims in the device',
    required: true
  }
);

let args = parser.parseArgs();

async () => {
  let buildLabelGroupName = 'Build Identifier';
  let flashProjectName = 'flash-fxos';
  let baseUrl = args.cloud_url;
  let username = args.username;
  let password = args.password;
  let deviceType = args.type;
  let buildUrl = args.build_url;
  let memory = args.memory;
  let sims = args.sims;

  try {
    let filter = {
      'build': buildUrl,
      'memory': memory,
      'type': deviceType,
      'sims': sims
    };

    let client = new Testdroid(baseUrl, username, password);
    let devices = await client.getDevices(filter);

    if (devices.length) {
      console.log(
        `Device with build was found, no need to flash. \n ` +
        `${util.inspect(devices[0])}`
      );
      return;
    }

    let project = await client.getProject(flashProjectName);
    let testRun = await project.createTestRun();

    let projectTestRunConfig = await project.getTestRunConfig(testRun);

    let testRunParams = await testRun.getParameters();
    for (let i = 0; i < testRunParams.length; i++) {
      await project.deleteTestRunParameter(testRun, testRunParams[i]);
    }

    await project.createTestRunParameter(testRun, {'key': 'FLAME_ZIP_URL', 'value': buildUrl});
    await project.createTestRunParameter(testRun, {'key': 'MEM_TOTAL', 'value': memory});
    devices = await client.getDevices({'type': deviceType, 'sims': sims});
    let device;
    if (devices) {
      device = devices.find(d => d.online === true);
    }
    if (!device) {
      throw new Error("Couldn't find device that is online");
    }

    let deviceIDs = { 'usedDeviceIds[]': device.id };

    let startTestRun = await testRun.start(deviceIDs);
    testRun = await project.getTestRun(testRun);
    let timeout = Date.now() + 10*60*1000;
    while (testRun.state !== 'FINISHED') {
      if (Date.now() > timeout) {
        let res = await testRun.abort();
        throw new Error(res.error);
      }
      await sleep(10000);
      testRun = await project.getTestRun(testRun);
    }
    device = await client.getDevices(filter);
    console.log(device);
  }
  catch (e) {
    console.log(e);
  }
}();
