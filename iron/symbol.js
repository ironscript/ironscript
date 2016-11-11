export default class IronSymbol {
  constructor (str) {
    this.symbol = str;
    this.type = 'ironsymbol';
  }

  equal (sym) {
    if (! sym instanceof IronSymbol ) return false;
    return sym.symbol === this.symbol;
  }

  startsWith (ch) {
    return this.symbol.startsWith(ch);
  }
}
