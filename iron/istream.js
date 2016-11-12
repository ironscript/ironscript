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



