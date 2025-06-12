export class Suffixer {
  #configs = {returnStrings: true, includeIndices: true};
  root = {c: new Map()};
  stringIds = [];
  strings = [];
  
  constructor(strings, configs) {
    if(strings?.constructor === Object) {
      configs = strings;
      strings = undefined;
    }

    if(strings) {
      let method = 'addString';

      if(Array.isArray(strings)) {
        method += 's';
      }

      this[method](strings);
    }

    if(configs) {
      this.setConfigs(configs);
    }
  }

  setConfigs(configs) {
    Object.assign(this.#configs, configs);
  }

  #getLeafInfo(node, strId, nodeChKey, chIndex) {
    let equalities = 0;
    let equalitiesWithinNode;
    let nodeChKeyIndex = chIndex;

    main:
    while(true) {
      let chEntry = node.c.get(nodeChKey);

      chIndex++;
      equalitiesWithinNode = 1;

      if(chEntry.length) {
        let edgeStrId = chEntry[0];
        let start = chEntry[1];
        let end = chEntry[2];
        var child = chEntry[3];
  
        for(var edgeChIndex = start + 1; edgeChIndex < end; edgeChIndex++, chIndex++) {
          if(this.strings[edgeStrId][edgeChIndex] !== this.strings[strId][chIndex]) {
            break main;
          }
  
          equalitiesWithinNode++;
        }
      } else {
        child = chEntry;
      }

      if(typeof child !== 'number') {
        equalities += equalitiesWithinNode;
        nodeChKey = this.strings[strId][chIndex];
        nodeChKeyIndex = chIndex;
        equalitiesWithinNode = 0;
        node = child;

        if(nodeChKey && node.c?.has(nodeChKey)) {
          continue;
        }

        nodeChKey = undefined;
        nodeChKeyIndex = undefined;
      }

      break;
    }

    return {
      node,
      nodeChKey,
      nodeChKeyIndex,
      unmatchedCh: this.strings[strId][chIndex],
      unmatchedChIndex: chIndex,
      edgeCh: nodeChKey && this.strings[node.c.get(nodeChKey)[0]][edgeChIndex],
      equalities: equalities + equalitiesWithinNode,
      equalitiesWithinNode
    };
  }

  #updateLeafInfo(startLeafInfo, strId) {
    let {node, nodeChKey, nodeChKeyIndex, equalitiesWithinNode} = startLeafInfo;
    let {unmatchedCh, unmatchedChIndex} = startLeafInfo;

    while(equalitiesWithinNode) {
      let child = node.c.get(nodeChKey);
      let chRange = 1;

      if(child.length) {
        chRange = child[2] - child[1];
        child = child[3];
      }

      if(chRange < equalitiesWithinNode) {
        node = child;
        nodeChKeyIndex += chRange;
        nodeChKey = this.strings[strId][nodeChKeyIndex];
        equalitiesWithinNode -= chRange;
        continue;
      }

      if(equalitiesWithinNode === chRange && typeof child !== 'number') {
        node = child;
        equalitiesWithinNode = 0;    
      }

      break;
    }

    startLeafInfo.node = node;
    startLeafInfo.nodeChKey = nodeChKey;
    startLeafInfo.nodeChKeyIndex = nodeChKeyIndex;
    startLeafInfo.equalitiesWithinNode = equalitiesWithinNode;

    if(equalitiesWithinNode || !node.c?.has(unmatchedCh)) {
      return startLeafInfo;
    }
    
    startLeafInfo = this.#getLeafInfo(node, strId, unmatchedCh, unmatchedChIndex);
    startLeafInfo.linkNode = node;
    return startLeafInfo;
  }

  #addLeaf(leafInfo, strId, chIndex, strLength) {
    let {equalitiesWithinNode, node, linkNode} = leafInfo;
    let {unmatchedCh, unmatchedChIndex} = leafInfo;
    let child = node;

    if(equalitiesWithinNode) {
      let {nodeChKey, edgeCh} = leafInfo;
      let chEntry = node.c.get(nodeChKey);
      let edgeStrId = chEntry[0];
      let start = chEntry[1];
      let newStart = start + equalitiesWithinNode;

      child = {};

      if(newStart - start === 1) {
        node.c.set(nodeChKey, child);
      } else {
        node.c.set(nodeChKey, [edgeStrId, start, newStart, child]);
      }

      if(edgeCh) {
        if(chEntry[2] - newStart === 1) {
          let child = chEntry[3];

          if(typeof child !== 'number') {
            chEntry = child;
          }
        }

        if(chEntry.length) {
          chEntry[1] = newStart;
        }

        child.c = new Map().set(edgeCh, chEntry);
      } else {
        let chIndex = chEntry[3];
        child.e = new Map().set(edgeStrId, chIndex);
      }
    }

    if(unmatchedCh) {
      (child.c ??= new Map()).set(unmatchedCh, [strId, unmatchedChIndex, strLength, chIndex]);
    } else {
      (child.e ??= new Map()).set(strId, chIndex);
    }

    return linkNode || child;
  }

  #matchAndAddLeaves(strId, ch, chIndex, strLength) {
    let startLeafInfo = this.#getLeafInfo(this.root, strId, ch, chIndex);
    let {equalities} = startLeafInfo;
    let nextChIndex = chIndex + equalities;
    let leafInfo = startLeafInfo;
    let prevInternalNode;

    while(equalities) {
      let linkNode = this.#addLeaf(leafInfo, strId, chIndex, strLength);

      if(prevInternalNode) {
        prevInternalNode.l = linkNode;
      }

      prevInternalNode = linkNode;

      if(--equalities) {
        let {node} = startLeafInfo;

        chIndex++;

        if(node.l) {
          startLeafInfo.node = node.l;
        } else {
          startLeafInfo.node = this.root;
          startLeafInfo.nodeChKey = this.strings[strId][chIndex];
          startLeafInfo.nodeChKeyIndex = chIndex;
          startLeafInfo.equalitiesWithinNode = equalities;
        }

        leafInfo = this.#updateLeafInfo(startLeafInfo, strId);
      }
    }

    return nextChIndex;
  }

  addString(string) {
    let strId = this.strings.push(string) - 1;
    let {root} = this;
    this.stringIds.push(strId);

    for(let chIndex = 0, {length} = string; chIndex < length; ) {
      let ch = string[chIndex];

      if(root.c.has(ch)) {
        chIndex = this.#matchAndAddLeaves(strId, ch, chIndex, length);
        continue;
      }

      root.c.set(ch, [strId, chIndex, length, chIndex++]);
    }
  }

  addStrings(strings) {
    for(let i = 0, {length} = strings; i < length; i++) {
      this.addString(strings[i]);
    }
  }

  #getPatternNodeInfo(pattern) {
    let {root: node} = this;

    for(let i = 0, {length} = pattern; true; ) {
      let ch = pattern[i++];
      let chEntry = node.c?.get(ch);

      if(chEntry) {
        let uncoveredChs = 0;

        if(chEntry.length) {
          let edgeStrId = chEntry[0];
          let start = chEntry[1];
          let end = chEntry[2];
          
          uncoveredChs = end - start - 1;
          var child = chEntry[3];
  
          for(let j = start + 1; j < end && i < length; j++, i++) {
            if(this.strings[edgeStrId][j] !== pattern[i]) {
              return;
            }
  
            uncoveredChs--;
          }
        } else {
          child = chEntry;
        }

        if(i < length) {
          node = child;
          continue;
        }

        return {
          chEntry,
          child,
          uncoveredChs
        };
      }

      break;
    }
  }

  #getPatternNodeAndInvoke(pattern, method, configs) {
    let patternNodeInfo = this.#getPatternNodeInfo(pattern);
    let results = [];

    if(patternNodeInfo) {
      results = method.call(this, patternNodeInfo);
      results = this.#packageQueryResults(results, configs);
    }

    return results;
  }

  #getResultsMapper({returnStrings, includeIndices}, hasIndices) {
    if(hasIndices) {
      if(returnStrings) {
        if(includeIndices) {
          return (result) => {
            let strId = result[0];
            result[0] = this.strings[strId];
            return result;
          }
        } else {
          return (result) => this.strings[result[0]];
        }
      } else {
        if(!includeIndices) {
          return (result) => result[0];
        }
      }
    } else {
      if(returnStrings) {
        return (strId) => this.strings[strId];
      }
    }
  }

  #packageQueryResults(results, configs) {
    let hasIndices = Array.isArray(results[0]);
    let updatedConfigs = this.#reconcileConfigs(configs);
    let mapper = this.#getResultsMapper(updatedConfigs, hasIndices);

    return mapper ? results.map(mapper) : results;
  }

  #reconcileConfigs(configs) {
    return Object.assign({}, this.#configs, configs);
  }

  endsWith(pattern, configs = {}) {
    return this.#getPatternNodeAndInvoke(pattern, this.#endsWith, configs);
  }

  #endsWith({chEntry, child, uncoveredChs}) {
    let results = [];

    if(!uncoveredChs) {
      if(typeof child === 'number') {
        results.push([chEntry[0], child]);
      } else {
        results = [...child.e.entries()];
      }
    }

    return results;
  }

  equals(pattern, configs = {}) {
    return this.#getPatternNodeAndInvoke(pattern, this.#equals, configs);
  }

  #equals({chEntry, child, uncoveredChs}) {
    let results = [];

    if(!uncoveredChs) {
      if(typeof child === 'number') {
        results.push(chEntry[0]);
      } else {
        child.e.forEach((chIndex, strId) => {
          if(chIndex === 0) {
            results.push(strId);
          }
        });
      }
    }

    return results;
  }

  excludes(pattern, configs = {}) {
    return this.#getPatternNodeAndInvoke(pattern, this.#excludes, configs);
  }

  #excludes(patternNodeInfo) {
    let includes = this.#includes(patternNodeInfo);
    let stringIds = new Set(this.stringIds);

    for(let i = 0, {length} = includes; i < length; i++) {
      let strId = includes[i][0];
      stringIds.delete(+strId);
    }

    return [...stringIds];
  }

  findDeepestNode() {
    let frames = [[this.root, 0]];
    let depth = -Infinity;
    let deepestNode;
    let nodeInfo;

    while((nodeInfo = frames.shift())) {
      let node = nodeInfo[0];
      let nodeDepth = nodeInfo[1];

      node.c.forEach((chEntry) => {
        if(chEntry.length) {
          let child = chEntry[3];

          if(child.c) {
            let chRange = chEntry[2] - chEntry[1];
            let currentDepth = nodeDepth + chRange;
            frames.push([child, currentDepth]);
          }
        } else if(chEntry.c) {
          frames.push([chEntry, nodeDepth + 1]);
        }
      });

      if(nodeDepth > depth) {
        deepestNode = node;
        depth = nodeDepth;
      }
    }

    if(deepestNode !== this.root) {
      return [deepestNode, depth];
    }

    return [];
  }

  findLongestCommon(configs = {}) {
    let frames = [[this.root]];
    let maxLength = 0;
    let maxCommonInfo;

    for(let nodeInfo; nodeInfo = frames.shift();) {
      let node = nodeInfo[0];
      
      node.c.forEach((chEntry, common) => {
        let parent = nodeInfo[1];
        let fullCommon = (parent?.common || '');
 
        if(chEntry.length) {
          var [strId, start, end, child] = chEntry;
          common = this.strings[strId].slice(start, end);
        } else {
          child = chEntry;
        }

        fullCommon += common;
        
        if(child.c) {
          let childCount = child.c.size;
          let current = {common: fullCommon, parent, strData: new Map(), childCount};

          child.e?.forEach((chIndex, strId) => current.strData.set(strId, [chIndex]));
          frames.push([child, current]);
        } else {
          let strData = new Map();
          let accumStrData = strData;

          if(typeof child === 'number') {
            strData.set(strId, [child]);
          } else {
            child.e.forEach((chIndex, strId) => strData.set(strId, [chIndex]));
          }

          while(parent && accumStrData.size < this.strings.length) {
            let {common, strData: parentStrData} = parent;
            fullCommon = common;

            strData.forEach((indices, strId) => {
              let allIndices = parentStrData.get(strId);

              if(!allIndices) {
                parentStrData.set(strId, allIndices = []);
              }

              allIndices.push(...indices);
            });

            if(--parent.childCount) {
              parent = null;
            } else {
              accumStrData = strData = parentStrData;
              parent = parent.parent;
            }
          }

          if(parent !== null && accumStrData.size === this.strings.length) {
            if(fullCommon.length > maxLength) {
              maxLength = fullCommon.length;
              maxCommonInfo = {strData: accumStrData, common: fullCommon};
            }
          }
        }
      });
    }

    if(maxCommonInfo) {
      let {strData} = maxCommonInfo;
      let newStrData = [];
      configs = this.#reconcileConfigs(configs);

      if(configs.returnStrings) {
        strData.forEach((indices, strId) => newStrData.push([this.strings[strId], indices]));
      } else {
        strData.forEach((indices, strId) => newStrData.push([strId, indices]));
      }

      maxCommonInfo.strData = newStrData;
    }

    return maxCommonInfo;
  }

  findLongestRepeating() {
    if(this.strings.length === 1) {
      let [deepestNode, depth] = this.findDeepestNode();

      if(deepestNode) {
        let indices = [];
        let string = this.strings[0];

        deepestNode.e?.forEach((index) => indices.push(index));
        deepestNode.c.forEach((chEntry) => indices.push(chEntry[3]));

        return {
          indices,
          repeating: string.slice(indices[0], indices[0] + depth)
        };
      }

      return;
    }

    throw new Error('suffixer: findLongestRepeating() works only with a one-string tree');
  }

  includes(pattern, configs = {}) {
    return this.#getPatternNodeAndInvoke(pattern, this.#includes, configs);
  }

  #includes({chEntry, child}) {
    let results = {};

    if(typeof child === 'number') {
      results[chEntry[0]] = [child];
    } else {
      let frames = [];
      
      do {
        child.e?.forEach((chIndex, strId) => {
          (results[strId] ??= []).push(chIndex);
        });

        child.c?.forEach((chEntry) => {
          if(chEntry.length) {
            let strId = chEntry[0];
            let child = chEntry[3];
  
            if(typeof child === 'number') {
              (results[strId] ??= []).push(child);
            } else {
              frames.push(child);
            }
          } else {
            frames.push(chEntry);
          }
        });
      } while((child = frames.shift()));
    }

    return Object.entries(results).map((result) => {
      result[0] = +result[0];
      return result; 
    });
  }

  startsWith(pattern, configs = {}) {
    return this.#getPatternNodeAndInvoke(pattern, this.#startsWith, configs);
  }

  #startsWith({chEntry, child}) {
    let results = [];

    if(typeof child === 'number') {
      if(child === 0) {
        results.push(chEntry[0]);
      }
    } else {
      let frames = [];
      
      do {
        child.e?.forEach((chIndex, strId) => {
          if(chIndex === 0) {
            results.push(strId);
          }
        });

        child.c?.forEach((chEntry) => {
          if(chEntry.length) {
            let strId = chEntry[0];
            let child = chEntry[3];
  
            if(typeof child === 'number') {
              if(child === 0) {
                results.push(strId);
              }
            } else {
              frames.push(child);
            }
          } else {
            frames.push(chEntry);
          }
        });
      } while((child = frames.shift()));
    }

    return results;
  }
}
