import {Parser, Cell, IronSymbol} from '../iron.js';
import Jsonfs from '../browser-runtime/utils/jsonfs.js';
import Runtime from '../browser-runtime/runtime.js';

import {readFileSync} from 'fs';
import {dirname, basename, join, extname} from 'path';


const _begin = new IronSymbol ('_begin');
const _sync = new IronSymbol ('_sync');
const _include = new IronSymbol ('_include');
const _import = new IronSymbol ('_import');

class Bundler {
  constructor (basedir) {
    this.visited = new Set();
    this.basedir = basedir;
    this.$ = new Runtime();
    this.$.mkdir ('include');
    this.$.mkdir ('bundle');
    this.$.cd ('bundle');
    this.dest = '/bundle';
  }

  eval (x) {
    if (x instanceof Cell) {
      if (_begin.equal(x.car) || _sync.equal(x.car)) {
        while (x.cdr instanceof Cell) {
          this.eval(x.cdr);
          x = x.cdr;
        }
      }
      else if (_import.equal(x.car) || _include.equal(x.car)) {
        this.readfile (x.cdr.car);
      }
      else this.eval(x.car);
    }
  }

  readfile (x) {
    let srcdir = null;
    let dest = null;
    let tmp = this.dest;

    if (!x.endsWith('.is')) {
      srcdir = join(__dirname, '../include',dirname(x));
      dest = join('/include', dirname(x));
      this.$.mkdir (dest);
      this.$.cd (dest);
      this.dest = dest;
    }
    else {
      srcdir = join(this.basedir, dirname(x));
      dest = join('.', dirname(x));
      this.$.mkdir (dest);
      this.$.cd(dest);
      this.dest = dest;
    }
    
    let filename = join(srcdir, basename(x));
    if (!this.visited.has(filename)) {
      let src = readFileSync(filename, 'utf8');
      
      this.$.touch(basename(x));
      this.$.open(basename(x)).write(src);
      let oldbase = this.basedir;
      this.basedir = srcdir;
      this.eval(new Parser({name:filename, buffer: src}).parse());
      this.basedir = oldbase;
      this.visited.add(filename);
    }
    this.$.cd('/bundle');
    this.dest = tmp;
  }

  static bundle (entry) {
    let b = new Bundler(dirname(entry));
    b.readfile(basename(entry));
    return b.$.root.dumps();
  }
}


export default function bundle () {
  let config = JSON.parse(readFileSync('./iron.config.json', 'utf8'));
  let bundleStr = Bundler.bundle (config.main);
  return 'IronscriptPackage("'+
    JSON.stringify({ config: config, rootfs: bundleStr }, null, 2) +
    '");';
}

/*

function test () {
  let x = Bundler.bundle ('../test/test.is');
  console.log(x);
  let f = Jsonfs.loads(x);
  let r = new Runtime();
  r.mount('/bundle', f.get('bundle'));
  r.mount('/include', f.get('include'));
  //console.log(r.readFile('/include/stdlib'));
  //r.run('/bundle/test.is');
}

//test();
    
*/



