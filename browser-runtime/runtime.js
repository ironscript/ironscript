import {join, basename, dirname, extname} from './path.js';
import Jsonfs from './jsonfs.js';

class Runtime {
  constructor () {
    this.root = new Jsonfs('root');


