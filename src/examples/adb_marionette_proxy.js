import Testdroid from 'testdroid-client';
let session;
async () => {
  let baseUrl = process.argv[2];
  let username = process.argv[3];
  let password = process.argv[4];

  if (process.argv.length < 5) {
    console.log("Must supply url, username, and password");
    process.exit(-1);
  }
  let session;
  let t;
  try {
    t = new Testdroid(baseUrl, username, password);
    let device = await t.getDeviceByName('t2m flame');
    session = await t.startDeviceSession(device.id);
    let adb = await t.getProxy('adb', session.id);
    let marionette = await t.getProxy('marionette', session.id);
    console.log(marionette);
  }
  catch (e) {
    console.log(e);
  }
  if (session) {
    await t.stopDeviceSession(session.id);
  }
}();
