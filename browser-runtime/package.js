import Runtime from './runtime.js';
import Jsonfs from './utils/jsonfs.js';
import {join} from './utils/path.js';

export default class Package {
  constructor (pkgStr) {
    let pkg = JSON.parse(pkgStr);

    let bundleStr = pkg.rootfs;
    let config = pkg.config;

    this.main = join('/bundle', config.main);
    this.jsImports = config.imports;
    this.runtime = new Runtime ();
    this._loadlock = this.jsImports.length;

    let f = Jsonfs.loads (bundleStr);
    this.runtime.mount ('/bundle', f.get('bundle'));
    this.runtime.mount ('/include', f.get('include'));
    
    //console.log(this.runtime);

    for (let imp of this.jsImports) {
      let cb = (script) => {
        let head = document.getElementsByTagName('head')[0];
        head.removeChild(script);
        this._loadlock -= 1;
        if(this._loadlock===0)this.run();
      }
      loadScript (imp.url, cb);
    }
  }

  run () {
    //console.log("Running ", this.main);
    this.runtime.run(this.main);
  }
}

function loadScript (url, callback) {
  let head = document.getElementsByTagName('head')[0];
  let script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  
  let cb = () => {callback(script);};
  script.onreadystatechange = cb;
  script.onload = cb;

  head.appendChild(script);
}
