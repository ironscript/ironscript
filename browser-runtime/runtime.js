import {default as Path, join, basename, dirname, extname} from './utils/path.js';
import Jsonfs from './utils/jsonfs.js';
import browserenv from './browser_env.js';

import {interpretSync} from '../iron.js';

export default class Runtime {
  constructor () {
    this.root = new Jsonfs('root');
    this.cwd = this.root;
  }

  get pwd () { return this.cwd.path; }

  context (basedir) {
    return {
      rootdir: this.root.path,
      basedir: basedir,
      pwd: this.pwd,
      readFile: this.readFile,
      open: this.open,
      cwd: this.cwd,
    };
  }

  run (filepath) {
    let src = this.readFile(filepath);
    interpretSync(src, filepath, browserenv(this.context(dirname(filepath))));
  }

  mkdir (path) {
    let d = this.cwd;
    let p = new Path(path);
    let count = 0;
    for (let name of p.arr) {
      let test = d.get(name);
      if (test) d = test;
      else {
        d = d.mkdir(name);
        count += 1;
      }
    }
    return count;
  }

  resolve (path) {
    let d = this.cwd;
    let p = new Path(path);
    for (let name of p.arr) {
      let test = d.get(name);
      if (!test || test.type !== 'directory') return false;
      d = test;
    }
    return d;
  }

  cd (path) {
    let d = this.resolve(path);
    if (!d) return false;
    this.cwd = d;
    return true;
  }

  mount (path, driverObject) {
    let p = dirname(path);
    let d = basename(path);
    this.resolve(p).mount(d, driverObject);
  }

  touch (filename) {
    this.cwd.touch (filename);
  }

  open (filepath) {
    let d = this.cwd;
    let absolutepath = join(this.pwd, filepath);
    let p = new Path(dirname(absolutepath));
    
    /*
    console.log(new Path(this.pwd));
    console.log(new Path(filepath));
    console.log(absolutepath);
    console.log(p);
    console.log('\n\n');
   
    console.log('*********#######################*********\n\n\n',d,'\n\n*********\n\n\n');
    */

    for (let name of p.arr) {
      //console.log(name);
      let test = d.get(name);
      //console.log('###', test);
      if (!test || test.type !== 'directory') return null;
      d = test;
    }
    let file = d.get(basename(filepath));
    if (file && file.type === 'file') return file;
    return null;
  }


  readFile (filepath) {
    //console.log('-----------------------',filepath,'----------------------');
    //debugger;
    let f = this.open (filepath);
    
    //console.log(new Path(filepath));

    if (f) return f.content;
    return null;
  }

}


