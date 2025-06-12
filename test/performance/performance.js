let fs                  = require('fs');
let path                = require('path');
let {Suffixer}          = require('../../dist/suffixer');
let {wordsShuffled}     = require('../_fixtures/words-shuffled');
let {wordsShuffled5000} = require('../_fixtures/words-shuffled-5000-cjs');
let {SuffixTree}        = require('./_lib/ukkonen');

let piPath = path.resolve(__dirname, '../_fixtures/pi-million-digits.txt');
let piDigits = fs.readFileSync(piPath, 'utf-8');
let wordsLabel = 'Words add time';
let piLabel = 'Pi digits add time';
let commonLabel = 'common substring time';
let searchIterations = 100;
let searchString = 'a';
let searchLabel = `"${searchString}" search time`;
let searchResults;
let tree;

console.log('A total of', wordsShuffled.length, 'unique words will be added');
console.time(wordsLabel);
tree = new Suffixer();
tree.addStrings(wordsShuffled);
console.timeEnd(wordsLabel);
console.log();

console.log(`Running exclude("${searchString}") across the`, wordsShuffled.length, 'words');
console.time(searchLabel);
tree.excludes(searchString);
console.timeEnd(searchLabel);
console.log();

console.log('Running a common substring search across the', wordsShuffled5000.length, 'words');
console.time(commonLabel);
tree = new Suffixer(wordsShuffled5000);
tree.findLongestCommon();
console.timeEnd(commonLabel);
console.log();

console.log(piDigits.length, 'digits of the number pi will be added');
console.time(piLabel);
tree = new Suffixer(piDigits);
console.timeEnd(piLabel);
console.log();

console.log(piDigits.length, 'digits of the number pi will be added (using ukkonen implementation)');
console.time(piLabel);
tree = new SuffixTree();
tree.addString(piDigits);
console.timeEnd(piLabel);
console.log();

console.log('A total of', wordsShuffled5000.length, 'unique words will be added');
console.time(wordsLabel);
tree = new Suffixer(wordsShuffled5000);
console.timeEnd(wordsLabel);
console.log('running', searchIterations, 'search iterations');
console.time(searchLabel);
for(let i = 0; i < searchIterations; i++) {
  searchResults = tree.includes(searchString);
}
console.timeEnd(searchLabel);
console.log('A total of', searchResults.length, 'words matched');
console.log();

console.log('A total of', wordsShuffled5000.length, 'unique words will be added (using ukkonen implementation)');
console.time(wordsLabel);
tree = new SuffixTree();
tree.addStrings(wordsShuffled5000);
console.timeEnd(wordsLabel);
console.log('running', searchIterations, 'search iterations');
console.time(searchLabel);
for(let i = 0; i < searchIterations; i++) {
  searchResults = tree.search(searchString);
}
console.timeEnd(searchLabel);
console.log('A total of', searchResults.length, 'words matched');
console.log();
