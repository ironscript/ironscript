export default class Path {
  constructor (pathstr) {
    if (!pathstr) this.arr = [];
    else {
      this.arr = pathstr.split('/');
      if (pathstr.startsWith('/')) this.arr[0] = '/';
      if (pathstr.endsWith('/')) this.arr.pop();
    }
    this.normalize();
  }

  get level () {
    return this.arr.length;
  }

  get path () {
    if (this.arr[0] === '/') {
      this.arr[0] = '';
      let r = this.arr.join('/'); 
      this.arr[0] = '/';
      return r;
    }
    return this.arr.join('/');
  }

  get dirname () {
    let arr = this.arr.slice(0, this.level-1);
    if (arr[0] === '/') {
      arr[0] = '';
      let r = arr.join('/'); 
      arr[0] = '/';
      return r;
    }
    return arr.join('/');
  }

  get basename () {
    return this.arr[this.level-1];
  }

  get extname () {
    let x = this.basename.split('.');
    if (x.length === 1) return '';
    return x[x.length-1];
  }

  append (p2) {
    this.arr.push(...p2.arr);
  }

  normalize () {
    let x = [];
    for (let name of this.arr) {
      if (name === '.') continue;
      else if (name === '/') x = ['/'];
      else if (name === '..') x.pop();
      else x.push(name);
    }
    this.arr = x;
  }
}
  
export function join (...paths) {
  let p = new Path();
  for (let path of paths) {
    p.append(new Path(path));
  }
  p.normalize();
  return p.path;
}

export function dirname (path) {
  return new Path(path).dirname;
}

export function basename (path) {
  return new Path (path).basename;
}

export function extname (path) {
  return new Path (path).extname;
}


