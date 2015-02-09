
import Testdroid from 'testdroid-client';

async () => {
  let baseUrl = process.argv[2];
  let username = process.argv[3];
  let password = process.argv[4];
  let deviceName = process.argv[5];

  if (process.argv.length < 6) {
    console.log("Must supply url, username, password, and device name");
    process.exit(-1);
  }
  try {
    let t = new Testdroid(baseUrl, username, password);
    let devices = await t.getDevicesByName(deviceName);
    console.log(`Found ${devices.length} devices matching '${deviceName}'`);
  }
  catch (e) {
    console.log(e);
  }

}();
