import {getCategory} from 'unicode-properties';

interface SourceCode {
  filename: string;
  contents: string;
}

interface SourcePosition {
  line: number;
  col: number;
}

interface SourceLocation {
  start: SourcePosition;
  end: SourcePosition;
}

class CharStream {
  private readonly src: string;
  private readonly filename: string;
  private offset: number;
  private line: number;
  private col: number;

  constructor(source: SourceCode) {
    this.src = source.contents;
    this.filename = source.filename;
    this.offset = 0;
    this.line = 1;
    this.col = 1;
  }

  next() {
    const ch = this.src.charAt(this.offset);
    this.offset += 1;
    if (ch === '\n') {
      this.line += 1;
      this.col = 1;
    } else {
      this.col += 1;
    }
    return ch;
  }

  peek() {
    return this.src.charAt(this.offset);
  }

  position(): SourcePosition {
    return {
      line: this.line,
      col: this.col,
    }
  }

  eof() {
    return this.peek() === '';
  }

  error(message: string) {
    throw new Error(`${this.filename}:${this.line}:${this.col} ${message}`);
  }
}

const KEYWORDS = {
  IMPORT: 'import',
  FROM: 'from',
  AS: 'as',
  EXPORT: 'export',

  CONST: 'const',
  LET: 'let',
  PURE: 'pure',
  TYPE: 'type',
  KIND: 'kind',
  WHERE: 'where',

  ASYNC: 'async',
  AWAIT: 'await',
  RETURN: 'return',

  FOR: 'for',
  IN: 'in',
  WHILE: 'while',
  BREAK: 'break',
  CONTINUE: 'continue',

  THROW: 'throw',
  THROWS: 'throws',
  TRY: 'try',
  CATCH: 'catch',
  FINALLY: 'finally',

  IF: 'if',
  ELSE: 'else',

  MATCH: 'match',
  SWITCH: 'switch',
  CASE: 'case',
  DEFAULT: 'default',

  THIS: 'this',
  EXTERN: 'extern',
};

const OPERATORS = {
  PLUS: '+',
  MINUS: '-',
  ASTERISK: '*',
  SLASH: '/',
  PERCENT: '%',
  EXPONENT: '**',
  PLUS_PLUS: '++',
  MINUS_MINUS: '--',

  AND: '&&',
  OR: '||',
  NOT: '!',
  EQUAL: '==',
  NOT_EQUAL: '!=',
  LESS_THAN: '<',
  GREATER_THAN: '>',
  LESS_THAN_OR_EQUAL: '<=',
  GREATER_THAN_OR_EQUAL: '>=',

  ASSIGN: '=',
  LITERAL_ASSIGN: ':=',

  PLUS_ASSIGN: '+=',
  MINUS_ASSIGN: '-=',
  ASTERISK_ASSIGN: '*=',
  SLASH_ASSIGN: '/=',
  PERCENT_ASSIGN: '%=',
  EXPONENT_ASSIGN: '**=',
  AND_ASSIGN: '&=',
  OR_ASSIGN: '|=',
  XOR_ASSIGN: '^=',
  LEFT_SHIFT_ASSIGN: '<<=',
  RIGHT_SHIFT_ASSIGN: '>>=',

  BIT_AND: '&',
  BIT_OR: '|',
  BIT_XOR: '^',
  BIT_NOT: '~',
  BIT_LEFT_SHIFT: '<<',
  BIT_RIGHT_SHIFT: '>>',

  COMPOSITION: '@',
  DOT: '.',
  COLON: ':',
  DOUBLE_COLON: '::',
  QUESTION_MARK: '?',
  ARROW: '=>',
};

const PUNCTUATION = {
  OPEN_PAREN: '(',
  CLOSE_PAREN: ')',
  OPEN_BRACE: '{',
  CLOSE_BRACE: '}',
  OPEN_BRACKET: '[',
  CLOSE_BRACKET: ']',
  SEMICOLON: ';',
  COMMA: ',',
};

const OPERATOR_START = Object.values(OPERATORS).reduce((acc, str) => {
  acc.add(str.charAt(0));
  return acc;
}, new Set());

const OPERATOR_PART = Object.values(OPERATORS).reduce((acc, str) => {
  for (let i = 1; i < str.length; i++) {
    acc.add(str.charAt(i));
  }
  return acc;
}, new Set());



type TokenType =
  | 'identifier'
  | 'keyword'
  | 'operator'
  | 'string_literal'
  | 'template_literal'
  | 'number_literal'
  | 'boolean_literal'
  | 'regex_literal'
  | 'null_literal'
  | 'punctuation'
  | 'comment';

interface Token {
  type: TokenType;
  value: string;
  location: SourceLocation;
}

class Lexer {
  static EMPTY = '';

  private readonly stream: CharStream;
  private readonly tokens: Token[];
  private current: Token | null;
  private startPos: SourcePosition;

  constructor(source: SourceCode) {
    this.stream = new CharStream(source);
    this.tokens = [];
  }

  static isSpace(ch: string) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
  }

  static isDigit(ch: string) {
    return ch >= '0' && ch <= '9';
  }

  static isHexDigit(ch: string) {
    return (
      Lexer.isDigit(ch) || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')
    );
  }

  static isBinaryDigit(ch: string) {
    return ch === '0' || ch === '1';
  }

  static isOctalDigit(ch: string) {
    return ch >= '0' && ch <= '7';
  }

  static isUnicodeDigit(ch: string) {
    return getCategory(ch) === 'Nd';
  }

  static isLetter(ch: string) {
    // chars in unicode categories Lu, Ll, Lt, Lm,  Lo and Sc
    const letterCategories = ['Lu', 'Ll', 'Lt', 'Lm', 'Lo', 'Sc'];
    return letterCategories.includes(getCategory(ch));
  }

  static isIdentifierStart(ch: string) {
    return Lexer.isLetter(ch) || ch === '_';
  }

  static isIdentifierPart(ch: string) {
    return (
      Lexer.isIdentifierStart(ch) ||
      Lexer.isDigit(ch) ||
      Lexer.isUnicodeDigit(ch)
    );
  }

  static isOperatorPart(ch: string) {
    return OPERATOR_CHARSET.has(ch);
  }

  static isPunctuation(ch: string) {
    return Object.values(PUNCTUATION).includes(ch);
  }

  startToken() {
    this.startPos = this.stream.position();
  }

  endToken(type: TokenType, value: string) {
    const token = {
      type,
      value,
      location: {
        start: this.startPos,
        end: this.stream.position(),
      },
    };
    this.tokens.push(token);
    return token;
  }

  readStringLiteral(start = '"') {
    let str = '';
    while (!this.stream.eof()) {
      const ch = this.stream.next();
      if (ch === '\\') {
        const peeked = this.stream.peek();
        if (peeked === 'n') {
          str += '\n';
          this.stream.next();
        } else if (peeked === 't') {
          str += '\t';
          this.stream.next();
        } else if (peeked === 'r') {
          str += '\r';
          this.stream.next();
        } else if (peeked === 'b') {
          str += '\b';
          this.stream.next();
        } else if (peeked === 'f') {
          str += '\f';
          this.stream.next();
        } else if (peeked === 'v') {
          str += '\v';
          this.stream.next();
        } else if (peeked === '\\') {
          str += '\\';
          this.stream.next();
        } else if (peeked === start) {
          str += start;
          this.stream.next();
        } else if (peeked === 'u') {
          this.stream.next();
          str += this.readStandardUnicodeEscape();
        } else if (peeked === 'U') {
          this.stream.next();
          str += this.readExtendedUnicodeEscape();
        } else {
          str += ch;
        }
      } else if (ch === start) {
        break;
      } else {
        str += ch;
      }
    }
    return str;
  }

  readStandardUnicodeEscape() {
    let point = 0;
    for (let i = 0; i < 4; i++) {
      const ch = this.stream.next();
      if (Lexer.isHexDigit(ch)) {
        point = point * 16 + parseInt(ch, 16);
      } else {
        // throw invalid hex value error
        this.stream.error('Invalid hex value in unicode escape');
      }
    }
    return String.fromCodePoint(point);
  }

  readExtendedUnicodeEscape() {
    let point = 0;
    const openingBrace = this.stream.next();
    if (openingBrace !== '{') {
      this.stream.error('Invalid extended unicode escape');
    }
    for (let i = 0; i < 8; i++) {
      const ch = this.stream.next();
      if (ch === '}') {
        if (point === 0) {
          this.stream.error(
            'Invalid extended unicode escape: missing code point',
          );
        }
        return String.fromCodePoint(point);
      }

      if (Lexer.isHexDigit(ch)) {
        point = point * 16 + parseInt(ch, 16);
      } else {
        this.stream.error('Invalid hex value');
      }
    }

    const closingBrace = this.stream.next();
    if (closingBrace !== '}') {
      this.stream.error('Invalid extended unicode escape');
    }

    return String.fromCodePoint(point);
  }

  readTemplateLiteral() {
    let str = '';
    while (!this.stream.eof()) {
      const ch = this.stream.next();
      if (ch === '`') {
        break;
      } else {
        str += ch;
      }
    }
    return str;
  }

  readSingleLineComment() {
    let str = '';
    while (!this.stream.eof()) {
      const ch = this.stream.peek();
      if (ch === '\n') {
        break;
      } else {
        str += ch;
      }
      this.stream.next();
    }
    return str;
  }

  readMultiLineComment() {
    let str = '';
    while (!this.stream.eof()) {
      const ch = this.stream.next();
      if (ch === '*') {
        const peeked = this.stream.peek();
        if (peeked === '/') {
          this.stream.next();
          break;
        }
      } else {
        str += ch;
      }
    }
    return str;
  }

  readRegexLiteral() {
    let regex = '';
    let flags = '';
    let escaped = false;
    while (!this.stream.eof()) {
      const rch = this.stream.next();
      if (escaped) {
        regex += '\\' + rch;
        escaped = false;
      } else {
        if (rch === '/') {
          break;
        } else if (rch === '\\') {
          escaped = true;
        } else {
          regex += rch;
        }
      }
    }
    // Read flags
    while (!this.stream.eof() && Lexer.isLetter(this.stream.peek())) {
      flags += this.stream.next();
    }

    this.validateRegex(regex, flags);
    return '/' + regex + '/' + flags;
  }

  validateRegex(regex: string, flags: string) {
    const validFlags = ['d', 'g', 'i', 'm', 's', 'u', 'v', 'y'];
    for (const flag of flags) {
      if (!validFlags.includes(flag)) {
        this.stream.error(`Invalid regular expression flag: ${flag}`);
      }
    }

    // check if the regex is valid and throw a descriptive error otherwise
    // TODO: implement a regex parser for source-language error reporting,
    // instead of relying on target environment like JS.
    try {
      new RegExp(regex, flags);
    } catch (e) {
      let message = '';
      if (e instanceof SyntaxError) {
        message = e.message;
      }
      this.stream.error(`Invalid regular expression: ${regex}. ${message}`);
    }
  }

  readDecimalNumberLiteral() {
    let num = 0;
    let decimalPoint = false;
    let exponent = false;
    let exponentValue = 0;
 
    while (!this.stream.eof()) {
      const ch = this.stream.peek();
      if (
        Lexer.isSpace(ch) ||
        Lexer.isPunctuation(ch) ||
        Lexer.isOperatorPart(ch)
      ) {
        break;
      } else if (Lexer.isDigit(ch)) {
        const digit = parseInt(ch, 10);
        num = decimalPoint ? num + digit / 10 : num * 10 + digit;
        this.stream.next();
      } else if (ch === '.') {
        decimalPoint = true;
        this.stream.next();
      } else if (ch === 'e' || ch === 'E') {
        exponent = true;
        this.stream.next();
        if (this.stream.peek() === '-') {
          this.stream.next();
        } else if (this.stream.peek() === '+') {
          this.stream.next();
        }

      } else {
        this.stream.error('Invalid number literal');
      }
    }
    return str;
  }

  readNext() {
    // consume spaces if any
    while (!this.stream.eof() && Lexer.isSpace(this.stream.peek())) {
      this.stream.next();
    }

    if (this.stream.eof()) {
      return null;
    }

    this.startToken();

    const ch = this.stream.peek();
    let tokenBuffer = '';

    if (ch === '/') {
      this.stream.next();
      const peeked = this.stream.peek();

      // is it a single line comment
      if (peeked === '/') {
        this.stream.next();
        return this.endToken('comment', this.readSingleLineComment());
      }

      // is it a multi line comment
      if (peeked === '*') {
        this.stream.next();
        return this.endToken('comment', this.readMultiLineComment());
      }


      // is it regex
      if (peeked !== '=' && !Lexer.isSpace(peeked)) {
        return this.endToken('regex_literal', this.readRegexLiteral());
      }

      // is it division-assignment operator
      if (peeked === '=') {
        this.stream.next();
        return this.endToken('operator', '/=');
      }

      return this.endToken('operator', '/');
    }

    if (Lexer.isPunctuation(ch)) {
      this.stream.next();
      return this.endToken('punctuation', ch);
    }

    if (Lexer.isOperatorStart(ch)) {
      tokenBuffer += ch;
      this.stream.next();

      while (!this.stream.eof() && Lexer.isOperatorPart(this.stream.peek())) {
        tokenBuffer += this.stream.next();
      }
      return this.endToken('operator', tokenBuffer);
    }

    if (ch === '"') {
      return this.endToken('string_literal', this.readStringLiteral());
    }

    if (ch === '`') {
      return this.endToken('template_literal', this.readTemplateLiteral());
    }

    if (Lexer.isDigit(ch)) {
      return this.endToken('number_literal', this.readDecimalNumberLiteral());
    }


  }

  next() {

  }

  peek() {

  }

}
