export function findDeepestNodeWithLink(tree, pattern) {
  let node = tree.root;
  let nodeWithLink;
  let depth;

  for(var i = 0, {length} = pattern; i < length; ) {
    let ch = pattern[i];
    let child = node.c.get(ch);

    if(child.length) {
      let start = child[1];
      let end = child[2];
      i += end - start;
      child = child[3];

      if(typeof child === 'number' || i > length) {
        break;
      }
    } else {
      i++;
    }

    if(child.l) {
      nodeWithLink = child;
      depth = i;
    }

    node = child;
  }

  return [nodeWithLink, depth];
}

export function getSuffixInfo(tree, suffix, node) {
  let {strings} = tree;
  let {length: suffixLength} = suffix;

  if(!node) {
    node = tree.root;
  }

  for(let i = 0; i < suffixLength; ) {
    let ch = suffix[i];
    var chEntry = node.c?.get(ch);

    if(chEntry) {
      if(chEntry.length) {
        let edgeStrId = chEntry[0];
        let start = chEntry[1];
        let end = chEntry[2];
        var child = chEntry[3];
  
        for(let j = start; j < end; j++) {
          if(strings[edgeStrId][j] !== suffix[i++]) {
            return false;
          }
        }

        if(typeof child !== 'number') {
          chEntry = child;
        }
      } else {
        i++;
      }
    } else {
      return false;
    }

    node = chEntry;
  }

  return node;
}
