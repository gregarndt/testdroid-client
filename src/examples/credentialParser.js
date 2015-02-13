import { ArgumentParser } from 'argparse';

let parser = new ArgumentParser({
  addHelp: true
});

parser.addArgument(
  ['-c', '--cloud-url'],
  {
    help: 'Cloud URL for Testdroid',
    required: true
  }
);

parser.addArgument(
  ['-u', '--username'],
  {
    help: 'Username for Testdroid api',
    required: true
  }
);

parser.addArgument(
  ['-p', '--password'],
  {
    help: 'Password for Testd`roid user',
    required: true
  }
);

export { parser };
