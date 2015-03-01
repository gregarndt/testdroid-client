import { parser } from './credentialParser';
import Testdroid from 'testdroid-client';

let session;
let args = parser.parseArgs();

async () => {
  let baseUrl = args.cloud_url;
  let username = args.username;
  let password = args.password;

  let session;
  let client;
  try {
    client = new Testdroid(baseUrl, username, password);
    let labelGroups = await client.getLabelGroups();
    console.log(labelGroups);
    for(let labelGroup of labelGroups) {
      let labels = await client.getLabelslInGroup(labelGroup.displayName);
      console.log(labels);
    }
  }
  catch (e) {
    console.log(e);
  }
}();
