import Testdroid from 'testdroid-client';

async () => {
  let baseUrl = process.argv[2];
  let username = process.argv[3];
  let password = process.argv[4];
  let buildLabel = process.argv[5];
  let labelGroupName = "Build Identifier";

  if (process.argv.length < 5) {
    console.log("Must supply url, username, and password");
    process.exit(-1);
  }
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
