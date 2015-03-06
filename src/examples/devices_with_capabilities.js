import { parser } from './credentialParser';
import Testdroid from 'testdroid-client';

parser.addArgument(
  ['-b', '--build'],
  {
    help: 'device build',
    required: false
  }
);

parser.addArgument(
  ['-m', '--memory'],
  {
    help: 'memory configuration for device',
    required: false
  }
);
parser.addArgument(
  ['-s', '--sims'],
  {
    help: 'number of sims in the device',
    required: false
  }
);

parser.addArgument(
  ['-d', '--type'],
  {
    help: 'device type',
    required: false
  }
);
let args = parser.parseArgs();

async () => {
  let baseUrl = args.cloud_url;
  let username = args.username;
  let password = args.password;
  let build = args.build;
  let deviceType = args.device_type;
  let memory = args.memory;
  let sims = args.sims;

  try {
    let client = new Testdroid(baseUrl, username, password);
    let capabilities = ['type', 'build', 'memory', 'sims'];
    let filter = {};
    capabilities.forEach((capability) => {
      if (args[capability]) {
        filter[capability] = args[capability];
      }
    });
    let devices = await client.getDevices(filter);
    if (!devices.length) {
      console.log('Device could not be found');
      return;
    }
    for(let device of devices) {
      console.log(
        `Found device '${device.displayName}' with device ID '${device.id}'`
      );
      console.log(device);
      let props = await client.getDeviceProperties(device);
      console.log(props);
    }
  }
  catch (e) {
    console.log(e);
  }
}();
