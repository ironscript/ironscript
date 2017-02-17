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


import Lexer from './lexer.js';
import Cell from './cell.js';
import IronSymbol from './symbol.js';

export default class Parser {
  constructor (input) {
    this.lex = new Lexer(input);
    this.root = this.parseList();
  }

  parse () {
    return this.root;
  }

  parseList (end) {
    let val = this.parseAtom();
    if (val === end || val === Lexer.eps) return null;
    
    let root = new Cell(val);
    let cur = root;
    val = this.parseAtom();
    
    while (val !== end && val !== Lexer.eps) {
      if (val === ')' || val === ']' || val === '}')
        this.error ('Parenthesis/Bracket mismatch');
      
      cur.cdr = new Cell (val);
      cur = cur.cdr;
      val = this.parseAtom();
    } 
    return root;
  }

  parseAtom () {
    if (this.lex.eof()) return Lexer.eps;
    let token = this.lex.next();
    
    if (token === '(') return this.parseList(')');
    else if (token === "'") return Cell.cons(new IronSymbol('_quote'), new Cell (this.parseAtom()) );
    else if (token === '[') return Cell.cons(new IronSymbol('_self'), this.parseList(']') );
    else if (token === '{') return Cell.cons(new IronSymbol('_coll'), this.parseList('}') );
    else if (token instanceof Array) {
      let cell = Cell.cons(new IronSymbol('_dot'), Cell.list(token));
      cell.ctx = 'get';
      return cell;
    }
    else return token;
  }

  error (msg) {
    this.lex.error ('[SYNTAX ERROR] '+msg);
  }

}
