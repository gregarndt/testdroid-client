import Testdroid from 'testdroid-client';

async () => {
  let baseUrl = process.argv[2];
  let username = process.argv[3];
  let password = process.argv[4];
  let buildLabel = process.argv[5];
  let labelGroupName = "Build version";

  if (process.argv.length < 5) {
    console.log("Must supply url, username, and password");
    process.exit(-1);
  }
  let session, t, labelGroup, label, device;
  try {
    t = new Testdroid(baseUrl, username, password);
    // get label group
    labelGroup = await t.getLabelGroup(labelGroupName);
    label = await t.getLabelInGroup(buildLabel, labelGroup);
    device = await t.getDevicesWithLabel(label);
    device = device[0];

    console.log(
      `Found device '${device.displayName}' with device ID '${device.id}'`
    );
  }
  catch (e) {
    console.log(e);
  }
  if (session) {
    await t.stopDeviceSession(session.id);
  }
}();
