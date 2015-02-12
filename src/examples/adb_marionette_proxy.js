import Testdroid from 'testdroid-client';
let session;
async () => {
  let baseUrl = process.argv[2];
  let username = process.argv[3];
  let password = process.argv[4];

  if (process.argv.length < 5) {
    console.log("Must supply url, username, and password");
    process.exit(1);
  }
  let session;
  let client;
  try {
    client = new Testdroid(baseUrl, username, password);
    let devices = await client.getDevicesByName('t2m flame');
    let device = devices.find(d => d.online === true);
    if (device) {
      session = await client.startDeviceSession(device.id);
      let adb = await client.getProxy('adb', session.id);
      let marionette = await client.getProxy('marionette', session.id);
      console.log(adb);
      console.log(marionette);
    }
    else {
      console.log("Could not find online device");
    }
  }
  //catch any errors and still let the session be released if necessary.
  catch (e) {
    console.log(e);
  }
  if (session) {
    await client.stopDeviceSession(session.id);
  }
}();
