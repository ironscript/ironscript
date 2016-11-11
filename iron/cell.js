export default class Cell {
  constructor (val) {
    this.car = val;
    this.cdr = null;
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
    while (cell.cdr != null) {
      str += Cell.printAtom (cell.car);
      str += " ";
      cell = cell.cdr;
    }
    str += Cell.printAtom (cell.car);
    str += ' ) ';
    return str;
  }

  static printAtom (cell) {
    if (cell instanceof Cell) return Cell.printList(cell);
    else if (cell instanceof Object && cell.type === "ironsymbol") 
      return cell.symbol;
    else return ''+cell;
  }
}

