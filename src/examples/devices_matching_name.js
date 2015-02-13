import { parser } from './credentialParser';
import Testdroid from 'testdroid-client';

parser.addArgument(
  ['-d', '--device-name'],
  {
    help: 'Memory configuration required (e.g. 319, 512)',
    required: true
  }
);

let args = parser.parseArgs();

async () => {
  let baseUrl = args.cloud_url;
  let username = args.username;
  let password = args.password;
  let deviceName = args.device_name;

  try {
    let client = new Testdroid(baseUrl, username, password);
    let devices = await client.getDevicesByName(deviceName);
    console.log(`Found ${devices.length} devices matching '${deviceName}'`);
  }
  catch (e) {
    console.log(e);
  }
}();
