import nodeEnv from './iron/node_env.js';
import {interpretSync} from './iron/interpret.js';
import {nextTick} from 'async-es';
import {readFile} from 'fs';
import {dirname} from 'path';

const filename = process.argv[2];
const basedir = dirname(filename);

readFile(filename, 'utf8', function (err, str) {
  if (err) throw err;
  interpretSync (str, filename, nodeEnv(basedir));
});
