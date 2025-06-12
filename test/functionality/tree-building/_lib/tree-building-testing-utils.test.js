import {expect}                                 from 'chai';
import {Suffixer}                               from '../../../../src/suffixer';
import {findDeepestNodeWithLink, getSuffixInfo} from './tree-building-testing-utils';

describe('Suffix Tree Building Testing Utilities', () => {
  let strings = ['plus', 'plush', 'push', 'way'];
  let tree = new Suffixer(strings);

  describe('findDeepestNodeWithLink()', () => {
    it('returns undefineds if no node with link exists in tree search path', () => {
      let result = findDeepestNodeWithLink(tree, 'plu');
      expect(result).to.eql([undefined, undefined]);
    });

    it('produces the deepest node with link plus the number of characters traversed to reach it', () => {
      let [node, depth] = findDeepestNodeWithLink(tree, 'plush');
      expect(node.l).to.equal(tree.root.c.get('p').c.get('l')[3].l);
      expect(depth).to.equal(4);
    })
  });

  describe('getSuffixInfo()', () => {
    it('returns false when a suffix does not exist in a tree', () => {
      expect(getSuffixInfo(tree, 'plu')).to.be.false;
      expect(getSuffixInfo(tree, 'another')).to.be.false;
    });

    it('produces an array edge record when a suffix is a unique leaf', () => {
      let strId = 3;
      let string = strings[strId];
      let suffixInfo = getSuffixInfo(tree, string);
      expect(suffixInfo[0]).to.equal(strId);
      expect(suffixInfo[1]).to.equal(0);
      expect(suffixInfo[2]).to.equal(string.length);
      expect(suffixInfo[3]).to.equal(0);
    });

    it('outputs a node with endings when a suffix belongs to multiple strings', () => {
      let suffix = 'ush';
      let {length: suffixLength} = suffix;
      let suffixesInfo = getSuffixInfo(tree, suffix);
      let {e} = suffixesInfo;
      expect(suffixesInfo.constructor).to.equal(Object);
      expect(e.get(1)).to.equal(strings[1].length - suffixLength);
      expect(e.get(2)).to.equal(strings[2].length - suffixLength);
    });

    it('allows specifying starting node', () => {
      let startingNode = getSuffixInfo(tree, 'plus');
      let result = getSuffixInfo(tree, 'h', startingNode);
      expect(result[0]).to.equal(1);
      expect(result[3]).to.equal(0);
    });

    it('accepts an empty string as a suffix', () => {
      let startingNode = getSuffixInfo(tree, 'plus');
      let result = getSuffixInfo(tree, '', startingNode);
      expect(result).to.equal(startingNode);
    });
  });
});
