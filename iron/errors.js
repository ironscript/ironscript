export default class IError {
  constructor (message) {
    this.message = message;
  }

  log () {
    console.log (this.message);
  }
}
