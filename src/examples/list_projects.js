import { parser } from './credentialParser';
import Testdroid from 'testdroid-client';

let args = parser.parseArgs();

async () => {
  let baseUrl = args.cloud_url;
  let username = args.username;
  let password = args.password;

  try {
    let session, client, projects, project;
    client = new Testdroid(baseUrl, username, password);
    projects = await client.getProjects();
    console.log(projects);
    project = await client.getProject(projects[0].name);
    console.log(project);
  }
  catch (e) {
    console.log(e);
  }
}();
