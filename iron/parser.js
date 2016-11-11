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
      if ( (end === ')' && val === ']') || (end === ']' && val === ')') )
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
    else return token;
  }

  error (msg) {
    this.lex.error ('[SYNTAX ERROR] '+msg);
  }

}
