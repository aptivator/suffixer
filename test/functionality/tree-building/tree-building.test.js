import {expect}                                 from 'chai';
import {Suffixer}                               from '../../../src/suffixer';
import {wordsShuffled5000}                      from '../../_fixtures/words-shuffled-5000';
import {findDeepestNodeWithLink, getSuffixInfo} from './_lib/tree-building-testing-utils';

describe('Suffix Tree Building', () => {
  let tree = new Suffixer();
  
  describe('constructor()', () => {
    it('can take a single string', () => {
      let string = 'one';
      let tree = new Suffixer(string);
      let result = tree.equals(string);
      expect(result).to.eql([string]);
    });

    it('accepts an array of strings', () => {
      let string = 'two';
      let strings = [string, string];
      let tree = new Suffixer(strings);
      let result = tree.equals(string);
      expect(result).to.eql(strings);
    });

    it('takes just a configuration object', () => {
      let tree = new Suffixer({returnStrings: false, includeIndices: false});
      let string = 'abracadabra';
      tree.addString(string);
      expect(tree.includes('a')).to.eql([0]);
    });

    it('receives a string or strings plus a configuration object', () => {
      let string = 'one';
      let strings = [string, string, string];
      let indices = Object.keys(strings).map(Number);
      let tree = new Suffixer(strings, {returnStrings: false});
      let results = tree.equals(string);
      expect(results).to.eql(indices);
    });
  });

  describe('suffixes', () => {
    it('adds multiple strings to a suffix tree', () => {
      tree.addStrings(wordsShuffled5000);
      expect(tree.strings).to.eql(wordsShuffled5000);
    });
  
    it('contains all suffixes of the added strings', () => {
      let {strings} = tree;
  
      for(let strId = 0, {length} = strings; strId < length; strId++) {
        let string = strings[strId];
        let {length: strLength} = string;
  
        for(let j = 0; j < strLength; j++) {
          let suffix = string.slice(j);
          let suffixesInfo = getSuffixInfo(tree, suffix);
          let strIndexForSuffix = strLength - suffix.length;
          
          if(suffixesInfo.length) {
            let edgeStrId = suffixesInfo[0];
            let startingIndex = suffixesInfo[3];
            expect(edgeStrId).to.equal(strId);
            expect(startingIndex).to.equal(strIndexForSuffix);
          } else {
            expect(suffixesInfo.e.get(strId)).to.equal(strIndexForSuffix);
          }
        }
      }
    });
  });

  describe('suffix links', () => {
    it('assigns links among internal nodes such that a link points to the very next suffix', () => {
      let {strings} = tree;

      for(let strId = 0, {length} = strings; strId < length; strId++) {
        let string = strings[strId];
        let [node, depth] = findDeepestNodeWithLink(tree, string);

        if(depth) {
          let uncoveredString = string.slice(depth);
          let linksToTake = depth;
          let startingIndexToMatch = 0;
          let expectedIterations = linksToTake;
          let iterations = 0;

          do {
            let suffixInfo = getSuffixInfo(tree, uncoveredString, node);

            if(suffixInfo.length) {
              var edgeStrId = suffixInfo[0];
              var startingIndex = suffixInfo[3];
  
              expect(edgeStrId).to.equal(strId);
            } else {
              startingIndex = suffixInfo.e.get(strId);
            }
  
            expect(startingIndex).to.equal(startingIndexToMatch++);
            node = node.l;
            iterations++;
          } while(--linksToTake);

          expect(node).to.be.undefined;
          expect(iterations).to.equal(expectedIterations);
        }
      }
    });
  });
});
