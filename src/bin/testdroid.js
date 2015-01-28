#!/usr/bin/env node
import { version } from '../../package.json';
import { ArgumentParser } from 'argparse';
import Testdroid from '../lib/testdroid';


let parser = new ArgumentParser({
  version: version,
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


let cmdParser = parser.addSubparsers({
  title:'subcommands',
  dest:'cmd'
});

var startSession = cmdParser.addParser('start-session');


let args = parser.parseArgs();
console.log(args);
console.dir(args);
