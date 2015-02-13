import { parser } from './credentialParser';
import Testdroid from 'testdroid-client';

let args = parser.parseArgs();

let session;
async () => {
  let session;
  let client;
  let baseUrl = args.cloud_url;
  let username = args.username;
  let password = args.password;
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
