import {baseNewLeafInfo, newLeafInfo} from './_lib/vars';

export class Suffixer {
  #configs = {returnStrings: true, includeIndices: true};
  root = {e: new Map()};
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

  #getNewLeafInfo(node, strId, chIndex, leafInfo = baseNewLeafInfo) {
    let edgeKey = this.strings[strId][chIndex];
    let leavesToAdd = 0;
    let offsetWithinEdge = 0;
    let edge = node.e.get(edgeKey);

    if(edge) {
      main:
      while(true) {
        chIndex++;
        offsetWithinEdge = 1;

        if(edge.length) {
          let edgeStrId = edge[0];
          let start = edge[1];
          let end = edge[2];
          var child = edge[3];
    
          for(var edgeChIndex = start + 1; edgeChIndex < end; edgeChIndex++, chIndex++) {
            if(this.strings[edgeStrId][edgeChIndex] !== this.strings[strId][chIndex]) {
              break main;
            }
    
            offsetWithinEdge++;
          }
        } else {
          child = edge;
        }

        if(typeof child !== 'number') {
          var edgeKeyIndex = chIndex;
          leavesToAdd += offsetWithinEdge;
          edgeKey = this.strings[strId][chIndex];
          offsetWithinEdge = 0;
          node = child;

          if(edgeKey && (edge = node.e?.get(edgeKey))) {
            continue;
          }

          edgeKey = undefined;
          edgeKeyIndex = undefined;
        }

        break;
      }
    } else {
      leavesToAdd = 1;
    }

    leafInfo.node = node;
    leafInfo.unmatchedCh = this.strings[strId][chIndex];
    leafInfo.unmatchedChIndex = chIndex;
    leafInfo.leavesToAdd = leavesToAdd + offsetWithinEdge;
    leafInfo.offsetWithinEdge = offsetWithinEdge;

    if(offsetWithinEdge) {
      leafInfo.edge = edge;
      leafInfo.edgeKey = edgeKey;
      leafInfo.edgeKeyIndex = edgeKeyIndex;

      if(edgeKey) {
        leafInfo.unmatchedEdgeCh = this.strings[node.e.get(edgeKey)[0]][edgeChIndex];
      }
    }

    return leafInfo;
  }

  #updateNewLeafInfo(strId) {
    let {node, edgeKey, edgeKeyIndex, offsetWithinEdge} = baseNewLeafInfo;
    let {unmatchedCh, unmatchedChIndex} = baseNewLeafInfo;

    while(offsetWithinEdge) {
      var edge = node.e.get(edgeKey);
      let child = edge;
      let edgeLength = 1;

      if(child.length) {
        edgeLength = child[2] - child[1];
        child = child[3];
      }

      if(edgeLength < offsetWithinEdge) {
        node = child;
        edgeKeyIndex += edgeLength;
        edgeKey = this.strings[strId][edgeKeyIndex];
        offsetWithinEdge -= edgeLength;
        continue;
      }

      if(offsetWithinEdge === edgeLength && typeof child !== 'number') {
        node = child;
        offsetWithinEdge = 0;    
      }

      break;
    }

    if(offsetWithinEdge || !node.e?.has(unmatchedCh)) {
      baseNewLeafInfo.node = node;
      baseNewLeafInfo.offsetWithinEdge = offsetWithinEdge;

      if(offsetWithinEdge) {
        baseNewLeafInfo.edge = edge;
        baseNewLeafInfo.edgeKey = edgeKey;
        baseNewLeafInfo.edgeKeyIndex = edgeKeyIndex;
      }
      
      return baseNewLeafInfo;
    }
    
    newLeafInfo.linkNode = node;
    return this.#getNewLeafInfo(node, strId, unmatchedChIndex, newLeafInfo);
  }

  #addLeaf(leafInfo, strId, chIndex, strLength) {
    let {offsetWithinEdge, node, linkNode} = leafInfo;
    let {unmatchedCh, unmatchedChIndex} = leafInfo;
    let child = node;

    if(offsetWithinEdge) {
      let {edgeKey, unmatchedEdgeCh, edge} = leafInfo;
      let edgeStrId = edge[0];
      let start = edge[1];
      let newStart = start + offsetWithinEdge;

      child = {};

      if(newStart - start === 1) {
        node.e.set(edgeKey, child);
      } else {
        node.e.set(edgeKey, [edgeStrId, start, newStart, child]);
      }

      if(unmatchedEdgeCh) {
        if(edge[2] - newStart === 1) {
          let child = edge[3];

          if(typeof child !== 'number') {
            edge = child;
          }
        }

        if(edge.length) {
          edge[1] = newStart;
        }

        child.e = new Map().set(unmatchedEdgeCh, edge);
      } else {
        child.$ = new Map().set(edgeStrId, edge[3]);
      }
    }

    if(unmatchedCh) {
      (child.e ??= new Map()).set(unmatchedCh, [strId, unmatchedChIndex, strLength, chIndex]);
    } else {
      (child.$ ??= new Map()).set(strId, chIndex);
    }

    return linkNode || child;
  }

  #matchAndAddLeaves(strId, chIndex, strLength) {
    let newLeafInfo = this.#getNewLeafInfo(this.root, strId, chIndex);
    let {leavesToAdd} = newLeafInfo;
    let nextChIndex = chIndex + leavesToAdd;
    let prevInternalNode;
    
    while(leavesToAdd) {
      let linkNode = this.#addLeaf(newLeafInfo, strId, chIndex, strLength);

      if(prevInternalNode) {
        prevInternalNode.l = linkNode;
      }

      prevInternalNode = linkNode;

      if(--leavesToAdd) {
        let {node} = baseNewLeafInfo;

        chIndex++;

        if(node.l) {
          baseNewLeafInfo.node = node.l;
        } else {
          baseNewLeafInfo.node = this.root;
          baseNewLeafInfo.edgeKey = this.strings[strId][chIndex];
          baseNewLeafInfo.edgeKeyIndex = chIndex;
          baseNewLeafInfo.offsetWithinEdge = leavesToAdd;
        }

        newLeafInfo = this.#updateNewLeafInfo(strId);
      }
    }

    return nextChIndex;
  }

  addString(string) {
    let strId = this.strings.push(string) - 1;
    this.stringIds.push(strId);

    for(let chIndex = 0, {length} = string; chIndex < length; ) {
      chIndex = this.#matchAndAddLeaves(strId, chIndex, length);
    }

    return strId;
  }

  addStrings(strings) {
    for(var i = 0, {length} = strings, strIds = []; i < length; i++) {
      let strId = this.addString(strings[i]);
      strIds.push(strId);
    }

    return strIds;
  }

  #getPatternNodeInfo(pattern) {
    let {root: node} = this;

    for(let i = 0, {length} = pattern; true; ) {
      let ch = pattern[i++];
      let edge = node.e?.get(ch);

      if(edge) {
        let uncoveredChs = 0;

        if(edge.length) {
          let edgeStrId = edge[0];
          let start = edge[1];
          let end = edge[2];
          
          uncoveredChs = end - start - 1;
          var child = edge[3];
  
          for(let j = start + 1; j < end && i < length; j++, i++) {
            if(this.strings[edgeStrId][j] !== pattern[i]) {
              return;
            }
  
            uncoveredChs--;
          }
        } else {
          child = edge;
        }

        if(i < length) {
          node = child;
          continue;
        }

        return {
          edge,
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

  #endsWith({edge, child, uncoveredChs}) {
    let results = [];

    if(!uncoveredChs) {
      if(typeof child === 'number') {
        results.push([edge[0], child]);
      } else {
        results = [...child.$.entries()];
      }
    }

    return results;
  }

  equals(pattern, configs = {}) {
    return this.#getPatternNodeAndInvoke(pattern, this.#equals, configs);
  }

  #equals({edge, child, uncoveredChs}) {
    let results = [];

    if(!uncoveredChs) {
      if(typeof child === 'number') {
        results.push(edge[0]);
      } else {
        child.$.forEach((chIndex, strId) => {
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

      node.e.forEach((edge) => {
        if(edge.length) {
          let child = edge[3];

          if(child.e) {
            let edgeLength = edge[2] - edge[1];
            let currentDepth = nodeDepth + edgeLength;
            frames.push([child, currentDepth]);
          }
        } else if(edge.e) {
          frames.push([edge, nodeDepth + 1]);
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
      
      node.e.forEach((edge, common) => {
        let parent = nodeInfo[1];
        let fullCommon = (parent?.common || '');
 
        if(edge.length) {
          var [strId, start, end, child] = edge;
          common = this.strings[strId].slice(start, end);
        } else {
          child = edge;
        }

        fullCommon += common;
        
        if(child.e) {
          let childCount = child.e.size;
          let current = {common: fullCommon, parent, strData: new Map(), childCount};

          child.$?.forEach((chIndex, strId) => current.strData.set(strId, [chIndex]));
          frames.push([child, current]);
        } else {
          let strData = new Map();
          let accumStrData = strData;

          if(typeof child === 'number') {
            strData.set(strId, [child]);
          } else {
            child.$.forEach((chIndex, strId) => strData.set(strId, [chIndex]));
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

        deepestNode.$?.forEach((index) => indices.push(index));
        deepestNode.e.forEach((edge) => indices.push(edge[3]));

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

  #includes({edge, child}) {
    let results = {};

    if(typeof child === 'number') {
      results[edge[0]] = [child];
    } else {
      let frames = [];
      
      do {
        child.$?.forEach((chIndex, strId) => {
          (results[strId] ??= []).push(chIndex);
        });

        child.e?.forEach((edge) => {
          if(edge.length) {
            let strId = edge[0];
            let child = edge[3];
  
            if(typeof child === 'number') {
              (results[strId] ??= []).push(child);
            } else {
              frames.push(child);
            }
          } else {
            frames.push(edge);
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

  #startsWith({edge, child}) {
    let results = [];

    if(typeof child === 'number') {
      if(child === 0) {
        results.push(edge[0]);
      }
    } else {
      let frames = [];
      
      do {
        child.$?.forEach((chIndex, strId) => {
          if(chIndex === 0) {
            results.push(strId);
          }
        });

        child.e?.forEach((edge) => {
          if(edge.length) {
            let strId = edge[0];
            let child = edge[3];
  
            if(typeof child === 'number') {
              if(child === 0) {
                results.push(strId);
              }
            } else {
              frames.push(child);
            }
          } else {
            frames.push(edge);
          }
        });
      } while((child = frames.shift()));
    }

    return results;
  }
}
