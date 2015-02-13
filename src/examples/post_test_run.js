import { parser } from './credentialParser';
import Testdroid from 'testdroid-client';

parser.addArgument(
  ['-p', '--project'],
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
  let projectName = args.project;

  if (process.argv.length < 5) {
    process.exit("Must supply url, username, and password");
  }

  try {
    let session, client, project;
    client = new Testdroid(baseUrl, username, password);
    project = await client.getProject(projectName);
    console.log(project);

    let testRun = await project.createTestRun(project);
    console.log(testRun);
  }
  catch (e) {
    console.log(e);
  }
}();
