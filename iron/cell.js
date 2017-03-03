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


export default class Cell {
  constructor (val) {
    this.car = val;
    this.cdr = null;
    this.ctx = null;
  }


  static cons (atom, cell) {
    let c = new Cell (atom);
    c.cdr = cell;
    return c;
  }

  static list (arr) {
    let root = null;
    let flag = false;
    let cur;
    for (let val of arr) {
      if (!flag) {
        root = new Cell (val);
        flag = true;
        cur = root;
      }
      else {
        cur.cdr = new Cell (val);
        cur = cur.cdr;
      }
    }
    return root;
  }

  static printList (cell) {
    let str = '( ';
    while (cell.cdr instanceof Cell) {
      str += Cell.printAtom (cell.car);
      str += " ";
      cell = cell.cdr;
    }
    str += Cell.printAtom (cell.car);
		if (cell.cdr !== null) str += ' : ' + Cell.printAtom(cell.cdr);
    str += ' ) ';
    return str;
  }

  static stringify (cell) {
    if (cell instanceof Cell) return Cell.printList(cell);
    else if (cell instanceof Object && cell.type === "ironsymbol") 
      return cell.symbol;
    else return JSON.stringify(cell);
  }

  static printAtom (cell) {
    if (cell instanceof Cell) return Cell.printList(cell);
    else if (cell instanceof Object && cell.type === "ironsymbol") 
      return cell.symbol;
    else return ''+cell;
  }
}

