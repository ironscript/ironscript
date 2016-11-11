export default class Istream {
  constructor (namedBuffer) {
    this.pos = 0;
    this.line = 1;
    this.col = 0;
    this.buffer = namedBuffer.buffer;
    this.name = namedBuffer.name;
  }

  next() {
    var ch = this.buffer.charAt(this.pos++);
    if (ch == '\n') {
      this.line++;
      this.col = 0;
    }
    else this.col++;
    return ch;
  }

  peek() { return this.buffer.charAt(this.pos); }
  eof() { return this.peek() === ''; }

  error(msg) {
    console.log(msg + " @ "+this.name+" (" + this.line + ":" + this.col + ")");
    throw new Error ('Ironscript CompileTime Error');
  }
}



