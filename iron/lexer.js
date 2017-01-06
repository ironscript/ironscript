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


import Istream from './istream.js';
import {fxAsync} from './higher.js';
import IronSymbol from './symbol.js';
const eps = '';

export default class Lexer {
  constructor (source) {
    this.source = new Istream(source);
    this.current = null;
  }

  static get eps () { return eps; }

  static isSpace (ch) {
    return " \t\n".indexOf(ch) >= 0;
  }

  static isOp (ch) {
    return /[\(\)\[\]\']/g.test(ch);
  }

  readString () {
    let str = "";
    while (!this.source.eof()) {
      let ch = this.source.next();
      if (ch == '\\') {
        if (this.source.peek() == '"') {
          str += this.source.next();
        }
        else if (this.source.peek() == 'n') {
          this.source.next();
          str += '\n';
        }
        else if (this.source.peek() == 't') {
          this.source.next();
          str += '\t';
        }
        else str += ch;
      }
      else if (ch == '"') break;
      else str += ch;
    }
    return str;
  }

  readSymbol (pre) {
    let str = pre;
    while (!this.source.eof()) {
      let ch = this.source.peek();
      if ( Lexer.isOp(ch) || Lexer.isSpace(ch) || ch == '"' ) break;
      str += this.source.next();
    }
    return new IronSymbol(str);
  }

  readSpecial (end) {
    let str = "";
    while (!this.source.eof()) {
      let ch = this.source.next();
      if (ch == end) {
        if(this.source.peek() == '@') {
          this.source.next();
          break;
        }
        else str += ch;
      }
      else str += ch;
    }
    return str;
  }
  
  readComment () {
    this.source.next();
    while (!this.source.eof() && this.source.peek() !== '\n') 
      this.source.next();
  }

  readNext () {
    while (!this.source.eof() && Lexer.isSpace(this.source.peek())) 
      this.source.next();
    if (this.source.eof()) return null;
 
    let ch = this.source.peek();
    if (ch == ';') {
      this.readComment();
      return this.readNext();
    }
    else if (Lexer.isOp(ch)) {
      return this.source.next();
    }
    else if (ch == '"') {
      this.source.next();
      return this.readString();
    }
    else if (ch == '@') {
      let pre = this.source.next();
      if (this.source.peek() == '{') {
        this.source.next();
        let fnStr = this.readSpecial('}');
        try {
          return fxAsync(new Function("$return", "$throw", "$catch", "$yield", "$scope", "...args", fnStr+';$return(null);')); // jshint ignore: line
        }
        catch (e) {
          console.error(fnStr);
          throw e;
        }
      }
      else if (this.source.peek() == '[') {
        this.source.next();
        return this.readSpecial(']');
      }
      else return this.readSymbol(pre);
    }
    else {
      let t = this.readSymbol(eps);
      if (isNaN(Number(t.symbol))) return t;
      else return Number(t.symbol);
    }
  }

  next () {
    let t = this.current;
    this.current = null;
    if (t === null) return this.readNext();
    return t;
  }

  peek () {
    if (this.current === null) 
      this.current = this.readNext();
    return this.current;
  }

  eof () {
    return this.peek() === null;
  }

  error (msg) {
    this.source.error (msg+' near "'+this.current+'" ');
  }

}





