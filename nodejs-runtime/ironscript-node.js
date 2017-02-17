/**
 * Copyright (c) 2016 Ganesh Prasad Sahoo (GnsP)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the "Software"), to deal 
 * in the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
 * SOFTWARE.
 *
 */


import {nextTick} from 'async-es';
import {readFile, readFileSync} from 'fs';
import {dirname, join} from 'path';

import nodeEnv from './node_env.js';
import {interpretSync} from '../iron.js';

let filename = null;
let basedir = null;
let config = null;

if (process.argv.length > 2) filename = process.argv[2];
else {
  config = JSON.parse(readFileSync('./iron.config.json', 'utf8'));
  if (!config) throw 'config could not be extracted from iron.config.json';
  filename = config.main;
}

if (filename) basedir = dirname(filename);

function loadScript (url, name) { 
  global[name] = require(join(process.cwd(),url)); 
}
if (config && config.imports) for (let imp of config.imports) loadScript (imp.url, imp.name);

readFile(filename, 'utf8', function (err, str) {
  if (err) throw err;
  interpretSync (str, filename, nodeEnv(basedir));
});
