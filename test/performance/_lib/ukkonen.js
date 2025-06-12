class SuffixTree {
  constructor() {
    this.text = '';

    this.words = [];
    this.nextStrIndex = 0;
    this.delimiters = [];

    this.root = new Node();
    this.bottom = new Node();
    this.root.suffixLink = this.bottom;

    this.s = this.root;
    this.k = 0;
    this.i = -1;
  }

  addStrings(strings) {
    for(let i = 0, {length} = strings; i < length; i++) {
      if(i % 10000 === 0) {
        console.log('added', i);
      }

      this.addString(strings[i]);
    }
  }

  addString(str) {
    if (str.length == 0) {
      return;
    }

    var sep = '#' + this.nextStrIndex + '#';
    str += sep;
    this.nextStrIndex++;

    var temp = this.text.length;
    this.text += str.toLowerCase();
    this.delimiters.push(sep);
    this.words.push(str);
    var s, k, i;
    s = this.s;
    k = this.k;
    i = this.i;

    for (var j = temp; j < this.text.length; j++) {
      this.bottom.addTransition(this.root, j, j, this.text[j]);
    }

    while (this.text[i + 1]) {
      i++;
      var up = this.update(s, k, i);
      up = this.canonize(up[0], up[1], i);
      s = up[0];
      k = up[1];
    }

    this.s = s;
    this.k = k;
    this.i = i;

    return this;
  }

  update(s, k, i) {
    var oldr = this.root;
    var endAndr = this.testAndSplit(s, k, i - 1, this.text[i]);
    var endPoint = endAndr[0];
    var r = endAndr[1];

    while (!endPoint) {
      r.addTransition(new Node(), i, Infinity, this.text[i]);

      if (oldr != this.root) {
        oldr.suffixLink = r;
      }

      oldr = r;
      var sAndk = this.canonize(s.suffixLink, k, i - 1);
      s = sAndk[0];
      k = sAndk[1];
      endAndr = this.testAndSplit(s, k, i - 1, this.text[i]);
      var endPoint = endAndr[0];
      var r = endAndr[1];
    }

    if (oldr != this.root) {
      oldr.suffixLink = s;
    }

    return [s, k];
  }

  testAndSplit(s, k, p, t) { 
    if (k <= p) {
      var traNs = s.transitions[this.text[k]];
      var s2 = traNs[0],
          k2 = traNs[1],
          p2 = traNs[2];

      if (t == this.text[k2 + p - k + 1]) {
        return [true, s];
      } else {
        var r = new Node();
        s.addTransition(r, k2, k2 + p - k, this.text[k2]);
        r.addTransition(s2, k2 + p - k + 1, p2, this.text[k2 + p - k + 1]);
        return [false, r];
      }
    } else {
      if (!s.transitions[t]) return [false, s];
      else return [true, s];
    }
  }

  canonize(s, k, p) {
    if (p < k) return [s, k];
    else {
      var traNs = s.transitions[this.text[k]];
      var s2 = traNs[0],
          k2 = traNs[1],
          p2 = traNs[2];

      while (p2 - k2 <= p - k) {
        k = k + p2 - k2 + 1;
        s = s2;
        if (k <= p) {
          var traNs = s.transitions[this.text[k]];
          s2 = traNs[0];
          k2 = traNs[1];
          p2 = traNs[2];
        }
      }

      return [s, k];
    }
  }

  search(pattern) {
    var matchedWordIds = [];
    var curNode = this.root;
    var curPatternIndex = 0;

    while (curNode != null) {
      var selectedTrans = null;
      for (let key in curNode.transitions) {
        if (key === pattern[curPatternIndex]) {
          selectedTrans = curNode.transitions[key];
          break;
        }
      }

      if (selectedTrans == null) {
        return [];
      }

      let textIndex = selectedTrans[1];

      for (; textIndex <= Math.min(selectedTrans[2], this.text.length - 1); textIndex++) {
        if (this.text[textIndex] === pattern[curPatternIndex]) {
          curPatternIndex++;
          if (curPatternIndex >= pattern.length) {
            break;
          }
        } else {
          return [];
        }
      }

      if (curPatternIndex >= pattern.length) {
        matchedWordIds = this.selectWordsUnder(selectedTrans);
        curNode = null;
      } else {
        curNode = selectedTrans[0];
      }
    }

    return Array.from(matchedWordIds)
      .filter((matchedWordId) => matchedWordId || matchedWordId === 0)
      .map((matchedWordId) =>
        this.words[matchedWordId].slice(0, this.words[matchedWordId].indexOf('#'))
      );
  }

  selectWordsUnder(transition) {
    let frontier = [{
      start: -1,
      end: -1,
      prefixCount: 0,
      transition,
      root: transition,
    }];

    var matchedWordIds = new Set();

    while (frontier.length > 0) {
      var curElement = frontier.pop();
      let textIndex = curElement.transition[1];
      
      for(;textIndex <= Math.min(curElement.transition[2], this.text.length - 1); textIndex++) {
        if(this.text[textIndex] === '#') {
          if(curElement.start < 0) {
            curElement.start = textIndex + 1;
          } else {
            curElement.end = textIndex;

            var matchedWordId = +this.text.slice(curElement.start - curElement.prefixCount, curElement.end);
            matchedWordIds.add(matchedWordId);

            break;
          }
        }
      }

      if (curElement.end < 0) {
        for (var key in curElement.transition[0].transitions) {
          frontier.push({
            start:
              curElement.start >= 0
                  ? curElement.transition[0].transitions[key][1]
                  : -1,
            end: -1,
            prefixCount:
              curElement.start >= 0
                  ? curElement.prefixCount + Math.min(curElement.transition[2], this.text.length - 1) -
                    curElement.start + 1
                  : 0,
            transition: curElement.transition[0].transitions[key],
            root: curElement.root,
          });
        }
      }
    }

    return matchedWordIds;
  }
}

class Node {
  constructor() {
    this.transitions = [];
    this.suffixLink = null;
  }

  addTransition(node, start, end, t) {
    this.transitions[t] = [node, start, end];
  }
}

module.exports = {SuffixTree};
