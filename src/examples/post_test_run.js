import Testdroid from 'testdroid-client';

async () => {
  let baseUrl = process.argv[2];
  let username = process.argv[3];
  let password = process.argv[4];
  let projectName = process.argv[5];

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
