import browserenv from './iron/browser_env.js';
import {interpretSync} from './iron/interpret.js';

document.addEventListener('DOMContentLoaded', () => {
  let main = document.getElementById('ironscript-main').text;
  interpretSync(main, 'ironscript-main', browserenv());
}, false);
