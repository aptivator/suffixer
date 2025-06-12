import {expect}                                   from 'chai';
import {Suffixer}                                 from '../../../src/suffixer';
import {wordsShuffled5000}                        from '../../_fixtures/words-shuffled-5000';
import {endsWith, excludes, includes, startsWith} from '../_lib/tree-querying-utils';

describe('Suffix Tree Querying', () => {
  let tree = new Suffixer(wordsShuffled5000);
  
  describe('endsWith()', () => {
    it('returns all strings that end with a search string', () => {
      let searchString = 'ally';
      let results = tree.endsWith(searchString);
      let expectedResults = endsWith(wordsShuffled5000, searchString);

      expect(results.length).to.be.greaterThan(0);
      expect(results.length).to.equal(expectedResults.size);

      for(let i = 0, {length} = results; i < length; i++) {
        let [string, index] = results[i];
        let expectedIndex = expectedResults.get(string);

        expect(index).to.equal(expectedIndex);
        expectedResults.delete(string);
      }

      expect(expectedResults.size).to.equal(0);
    });

    it('searches a whole word (for coverage)', () => {
      let results = tree.endsWith(wordsShuffled5000[0]);
      let specificResult = results.find((result) => result[0] === wordsShuffled5000[0]);
      expect(specificResult).to.eql([wordsShuffled5000[0], 0]);
    });

    it('presents an empty array when search string does not occur at the end of any string in a tree', () => {
      let results = tree.endsWith('non-existing');
      expect(results).to.eql([]);
    });

    it('can be configured to exclude strings and or indices', () => {
      let results = tree.endsWith('ally', {includeIndices: false});
      expect(results[0]).to.be.a('string');
      results = tree.endsWith('ally', {returnStrings: false});
      expect(results[0][0]).to.be.a('number');
      expect(results[0][1]).to.be.a('number');
    });
  });

  describe('equals()', () => {
    it('retrieves a single occurrence of a search string', () => {
      let results = tree.equals(wordsShuffled5000[0]);
      expect(results).to.eql([wordsShuffled5000[0]]);
    });

    it('returns multiple occurrences of a search string', () => {
      let string = 'dmitriy';
      let tree = new Suffixer();
      let strings = [string, string];
      tree.addStrings(strings);
      expect(tree.equals(string)).to.eql(strings);
    });

    it('gives an empty array if there are no exact strings in a tree', () => {
      let results = tree.equals(wordsShuffled5000[0] + 'd');
      expect(results).to.eql([]);
    });

    it('takes only returnStrings setting', () => {
      let strId = 25;
      let results = tree.equals(wordsShuffled5000[strId], {returnStrings: false});
      expect(results).to.eql([strId]);
    });
  });

  describe('excludes()', () => {
    it('finds all strings that do not include a search string', () => {
      let searchString = 'a';
      let results = tree.excludes(searchString);
      let expectedResults = excludes(wordsShuffled5000, searchString);

      expect(results.length).to.be.above(0);
      expect(results.length).to.equal(expectedResults.size);

      for(let i = 0, {length} = results; i < length; i++) {
        expectedResults.delete(results[i]);
      }

      expect(expectedResults.size).to.equal(0);
    });

    it('accepts only returnStrings configuration', () => {
      let results = tree.excludes('t', {returnStrings: false});
      expect(results[0]).to.be.a('number');
    });
  });

  describe('findDeepestNode()', () => {
    it('outputs the deepest internal node plus character depth', () => {
      let strings = ['plus', 'plush', 'push', 'way'];
      let tree = new Suffixer(strings);
      let [deepestNode, depth] = tree.findDeepestNode();
      expect(deepestNode).to.equal(tree.root.c.get('p').c.get('l')[3]);
      expect(depth).to.equal(4);
    });

    it('presents an empty array when there are no internal nodes', () => {
      let tree = new Suffixer(['way', 'pile']);
      expect(tree.findDeepestNode()).to.eql([]);
    });
  });

  describe('findLongestCommon()', () => {
    let aStrings = tree.startsWith('a', {includeIndices: false});
    let aTree = new Suffixer(aStrings);

    it('determines the longest common substring shared among all strings in a tree', () => {
      let expectedResults = includes(aStrings, 'a');
      let {strData, common} = aTree.findLongestCommon();
      expect(common).to.equal('a');
      expect(strData.length).to.be.above(0);
      expect(strData.length).to.equal(expectedResults.size);

      for(let i = 0, {length} = strData; i < length; i++) {
        let [string, indices] = strData[i];
        let expectedIndices = expectedResults.get(string);

        expect(indices.length).to.equal(expectedIndices.size);

        for(let j = 0, {length} = indices; j < length; j++) {
          expectedIndices.delete(indices[j]);
        }

        expect(expectedIndices.size).to.equal(0);
        expectedResults.delete(string);
      }

      expect(expectedResults.size).to.equal(0);
    });

    it('supports returnStrings setting', () => {
      let {strData} = aTree.findLongestCommon({returnStrings: false});
      expect(strData[0][0]).to.be.a('number');
    });

    it('returns undefined when strings have no common substring', () => {
      let commonResult = tree.findLongestCommon();
      expect(commonResult).to.be.undefined;
    });
  });

  describe('findLongestRepeating()', () => {
    it('errors when a tree contains more than one string', () => {
      expect(() => tree.findLongestRepeating()).to.throw(/suffixer: findLongestRepeating\(\) works only with a one-string tree/);
    });

    it('locates a non-overlapping repeating substring', () => {
      let tree = new Suffixer('wayfoundwayplus');
      let searchString = 'way';
      let [[, indices]] = tree.includes(searchString);
      let result = tree.findLongestRepeating();
      expect(result).to.eql({repeating: searchString, indices});
    });

    it('uses deepest node that has ends and children (for coverage)', () => {
      let tree = new Suffixer('wayway');
      let searchString = 'way';
      let [[, indices]] = tree.includes(searchString);
      let result = tree.findLongestRepeating();
      expect(result).to.eql({repeating: searchString, indices});
    });

    it('gives undefined when no repeating substring is found', () => {
      let tree = new Suffixer('abcdefgh');
      expect(tree.findLongestRepeating()).to.be.undefined;
    });
  });

  describe('includes()', () => {
    it('finds all within-string search string occurrences', () => {
      let searchString = 'al';
      let results = tree.includes(searchString);
      let expectedResults = includes(wordsShuffled5000, searchString);
      
      expect(results.length).to.be.greaterThan(0);
      expect(results.length).to.equal(expectedResults.size);

      for(let i = 0, {length} = results; i < length; i++) {
        let [string, indices] = results[i];
        let expectedIndices = expectedResults.get(string);

        expect(indices.length).to.be.greaterThan(0);
        expect(expectedIndices.size).to.equal(indices.length);

        for(let j = 0, {length} = indices; j < length; j++) {
          expectedIndices.delete(indices[j]);
        }

        expect(expectedIndices.size).to.equal(0);
      }
    });

    it('locates a whole word (for coverage)', () => {
      let results = tree.includes(wordsShuffled5000[0]);
      let specificResult = results.find((result) => result[0] === wordsShuffled5000[0]);
      expect(specificResult).to.eql([wordsShuffled5000[0], [0]]);
    });

    it('returns an empty array when search string is not within a tree', () => {
      let searchString = 'dmitriy';
      let results = tree.includes(searchString);
      expect(results).to.eql([]);
    });

    it('accepts configuration that controls whether to return strings and/or indices', () => {
      let searchString = 'al';
      let results = tree.includes(searchString, {returnStrings: false, includeIndices: false});
      expect(results[0]).to.be.a('number');
    });
  });

  describe('startsWith()', () => {
    it('selects all strings that begin with a specified strings', () => {
      let searchString = 't';
      let results = tree.startsWith(searchString);
      let expectedResults = startsWith(wordsShuffled5000, searchString);

      expect(expectedResults.size).to.equal(results.length);
      expect(results.length).to.be.above(0);

      for(let i = 0, {length} = results; i < length; i++) {
        let string = results[i];
        expectedResults.delete(string);
      }

      expect(expectedResults.size).to.equal(0);
    });

    it('finds a whole word (for coverage)', () => {
      let results = tree.startsWith(wordsShuffled5000[0]);
      expect(results.includes(wordsShuffled5000[0])).to.be.true;
    });

    it('produces an empty array when a tree does not have any strings that start with a search pattern', () => {
      let results = tree.startsWith('somestringpattern');
      expect(results).to.eql([]);
    });

    it('takes only returnStrings configuration', () => {
      let results = tree.startsWith('a', {returnStrings: false});
      expect(results[0]).to.be.a('number');
    });
  });
});
