import Testdroid from 'testdroid-client';

async () => {
  let baseUrl = process.argv[2];
  let username = process.argv[3];
  let password = process.argv[4];

  if (process.argv.length < 5) {
    process.exit("Must supply url, username, and password");
  }

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
