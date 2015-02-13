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

let args = parser.parseArgs();

async () => {
  let buildLabelGroupName = 'Build Identifier';
  let flashProjectName = 'flash-fxos';
  let baseUrl = args.cloud_url;
  let username = args.username;
  let password = args.password;
  let buildUrl = args.build_url;
  let memory = args.memory;

  try {
    let client = new Testdroid(baseUrl, username, password);

    let labelGroup = await client.getLabelGroup(buildLabelGroupName);

    let label = await client.getLabelInGroup(`${memory}_${buildUrl}`, labelGroup);
    if (label) {
      let devices = await client.getDevicesWithLabel(label);
      if (devices.length) {
        console.log(
          `Device with build was found, no need to flash. \n ` +
          `${util.inspect(devices[0])}`
        );
        return;
      }
    }

    let project = await client.getProject(flashProjectName);
    process.exit();
    let testRun = await project.createTestRun();

    let projectTestRunConfig = await project.getTestRunConfig(testRun);

    let testRunParams = await testRun.getParameters();
    for (let i = 0; i < testRunParams.length; i++) {
      await project.deleteTestRunParameter(testRun, testRunParams[i]);
    }

    await project.createTestRunParameter(testRun, {'key': 'FLAME_ZIP_URL', 'value': buildUrl});
    await project.createTestRunParameter(testRun, {'key': 'MEM_TOTAL', 'value': memory});
    let devices = await client.getDevicesByName('t2m flame');
    let device = devices.find(d => d.online === true);
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
  }
  catch (e) {
    console.log(e);
  }
  if (session) {
    await client.stopDeviceSession(session.id);
  }
}();
