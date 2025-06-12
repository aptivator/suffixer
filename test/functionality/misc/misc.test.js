import {expect}   from 'chai';
import {Suffixer} from '../../../src/suffixer';
import {includes} from '../_lib/tree-querying-utils';

describe('miscellaneous', () => {
  it('works with "complex" characters', () => {
    let strings = ['text🙂🙂🙂🙂🙂🙂', '😆😆😆😆🙂🙂'];
    let tree = new Suffixer(strings);
    let results = tree.includes('😆');
    let expectedResults = includes(strings, '😆');
    
    expect(results.length).to.be.above(0);
    expect(expectedResults.size).to.equal(results.length);

    for(let i = 0, {length} = results; i < length; i++) {
      let [string, indices] = results[i];
      let expectedIndices = expectedResults.get(string);

      expect(expectedIndices.size).to.equal(indices.length);

      for(let j = 0, {length} = indices; j < length; j++) {
        expectedIndices.delete(indices[j]);
      }

      expect(expectedIndices.size).to.equal(0);
      expectedResults.delete(string);
    }

    expect(expectedResults.size).to.equal(0);
  });
});
