export default class Path {
  constructor (pathstr) {
    if (!pathstr) this.arr = [];
    else this.arr = pathstr.split('/');
  }

  get level () {
    return this.arr.length;
  }

  get dirname () {
    return this.arr.slice(0, this.level-1).join('/');
  }

  get basename () {
    return this.arr[this.level-1];
  }

  get extname () {
    let x = this.basename.split('.');
    return x[x.length-1];
  }

  append (p2) {
    this.arr.push(...p2.arr);
  }
}
  
export function join (...paths) {
  let p = new Path();
  for (let path of paths) {
    p.append(new Path(path));
  }
  return p;
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


