let fs        = require('fs');
let path      = require('path');
let {shuffle} = require('./_lib/test-utils');

let wordsDirectory = path.resolve(__dirname, '../_fixtures');
let wordsPath = path.resolve(wordsDirectory, 'words.txt');
let wordsJsShuffledPath = path.resolve(wordsDirectory, 'words-shuffled.js');
let wordsJsShuffled5000Path = path.resolve(wordsDirectory, 'words-shuffled-5000.js');
let wordsJsShuffled5000CjsPath = path.resolve(wordsDirectory, 'words-shuffled-5000-cjs.js');
let words = fs.readFileSync(wordsPath, 'utf-8').split(/\s+/);

shuffle(words);

fs.writeFileSync(wordsJsShuffledPath, `module.exports = {wordsShuffled: ${JSON.stringify(words, null, 2)}};`);
fs.writeFileSync(wordsJsShuffled5000Path, `export const wordsShuffled5000 = ${JSON.stringify(words.slice(0, 5000), null, 2)};`);
fs.writeFileSync(wordsJsShuffled5000CjsPath, `module.exports = {wordsShuffled5000: ${JSON.stringify(words.slice(0, 5000), null, 2)}};`);
