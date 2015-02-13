import { parser } from './credentialParser';
import Testdroid from 'testdroid-client';

parser.addArgument(
  ['-b', '--build-label'],
  {
    help: 'Label assigned to a device',
    required: true
  }
);
let args = parser.parseArgs();

async () => {
  let baseUrl = args.cloud_url;
  let username = args.username;
  let password = args.password;
  let buildLabel = args.build_label;
  let labelGroupName = "Build Identifier";

  let session, client, labelGroup, label, device;
  try {
    client = new Testdroid(baseUrl, username, password);
    // get label group
    labelGroup = await client.getLabelGroup(labelGroupName);
    label = await client.getLabelInGroup(buildLabel, labelGroup);
    device = await client.getDevicesWithLabel(label);
    if (device.length) {
      device = device[0];
      console.log(
        `Found device '${device.displayName}' with device ID '${device.id}'`
      );
    }
    else {
      console.log('Device could not be found');
    }
  }
  catch (e) {
    console.log(e);
  }
}();
