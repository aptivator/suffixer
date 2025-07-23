# Generalized Suffix Tree Construction

## Table of Contents

* [Introduction](#introduction)
* [Disclaimer](#disclaimer)
* [Prerequisites](#prerequisites)
  * [Basic Terminology](#basic-terminology)
  * [Generalized Suffix Tree Data Structure](#generalized-suffix-tree-data-structure)
* [Algorithm Description](#algorithm-description)
  * [Initial Data Structure](#initial-data-structure)
  * [Addition of a Word that Has None of its Suffixes in a Tree](#addition-of-a-word-that-has-none-of-its-suffixes-in-a-tree)
  * [Addition of a Word that Contains Some of its Suffixes in a Tree](#addition-of-a-word-that-contains-some-of-its-suffixes-in-a-tree)
  * [Addition of Suffixes Using Suffix Links](#addition-of-suffixes-using-suffix-links)
  * [Important Edge Cases When Building a Multi-String Suffix Tree](#important-edge-cases-when-building-a-multi-string-suffix-tree)
    * [Existence of an Unmatched Character Starting Edge on One of the Nodes](#existence-of-an-unmatched-character-starting-edge-on-one-of-the-nodes)
    * [`offsetWithinEdge` Exceeding an Edge Length](#offsetwithinedge-exceeding-an-edge-length)
* [Conclusion](#conclusion)


## Introduction

Ukkonen's suffix tree construction algorithm, in its
[academic format](./ukkonen-1995-on-line-construction-of-suffix-trees.pdf), is unlikely
to be readily accessible for most readers.  The terminology employed plus the terseness
of the language make it challenging to understand and implement an otherwise
interesting approach.  Probably the most helpful resources to grasp the essence of the
process are videos that take one step by step through a suffix tree construction:
[video 1](https://www.youtube.com/watch?v=yg8Rkv8WLSg) and [video 2](https://www.youtube.com/watch?v=aPRqocoBsFQ).
Many such instructionals adopt the original terminology (e.g., active point) and are
predominantly single-string focused.  The distinct purpose of this write-up is to provide
a step-by-step outline and description of generalized (i.e., multi-string) suffix tree
construction.  The differentiating and hopefully helpful feature of this explanation is
its highlighting of the changes in an actual underlying data structure rather than a
visualizing of an expanding suffix tree.

## Disclaimer

Linear time and online construction of suffix trees is not the easiest algorithmic
and implementation challenge.  This document aims to cover all scenarios that may arise
as a multi-string suffix tree is built.  The result is a verbose document that requires a
requisite degree of effort as it has to be read sequentially.

## Prerequisites

### Basic Terminology

A `tree` is a hierarchical data structure consisting of `nodes` and `edges`.  A `node` is
a juncture point out of which the `edges` originate.  An `edge` is a branch that links a
`node` to another `node`.  Such connecting `edges` are called stems.  An `edge` that does
not lead to another `node` and instead stands on its own is called a `leaf`.

### Generalized Suffix Tree Data Structure

Besides the `node` and the `edge`, `suffixer` also uses concepts of the `ending` and the
`link`.  A node can have a collection of `ending`s.  The latter is a map that records
which strings end with a substring represented by a total edge that goes from the top of
a tree (i.e., from the root node) all the way through to the node that has the `ending`s'
entries.  The map links a string identifier to the character index of the string from
which an `ending` starts.  An `ending` does not always require an explicit representation.
Every `leaf` - an `edge` that does not lead to a node - is an ending.  A suffix `link`,
if available, should connect a node to another node such that the total edge above the
second node is exactly one character less (from the top) compared to the total edge
leading to the first node.  For example, if the total edge before a node is `wayfare`,
then that node should link to a node whose total edge is `ayfare`.  For more details,
please see the following explanation of the [suffix tree data structure](./suffix-tree-data-structure.md).

## Algorithm Description

### Initial Data Structure

Suppose we want to build a generalized suffix tree consisting of words: `way`, `ways`,
`say`, `yfere`, and `wayfare`.  At the beginning of this process, the suffix tree is the
following empty data structure where the root node contains an empty map for its children
edges.

*Starting Suffix Tree Data Structure*
```
{
  edges: {}
}
```

### Addition of a Word that Has None of its Suffixes in a Tree

The first word to add is `way` and the `addString()` method within `suffixer` starts the
process.  The function pushes the word to a strings array and gets an integer identifier
for the word (`0` to start).  Then, beginning from the first character (`w`) the
`matchAndAddLeaves()` function attempts to find how many characters of the `way` string
are already represented in the tree.  `getNewLeafInfo()` internal method is used to
follow the structure starting from the root node.

`getNewLeafInfo()` returns information, gathered during a tree traversal, that guides an
addition of a new suffix into the tree.  During that first call `getNewLeafInfo()` should
determine that not a single character of the word `way` starting with `w` matches any
part of the tree because the tree is empty.  The function can return up to eight pieces
of control data.  For this iteration the relevant are the following five: `leavesToAdd`,
`unmatchedCh`, `unmatchedChIndex`, `offsetWithinEdge`, and `node`.  `leavesToAdd` will be
at least 1 and it can equal the number of characters of a string that match against a
tree.  The number of matches equals the number of new suffixes that will be added during
a `matchAndAddLeaves()` call.  In the current case, since none of the characters are
matched, only 1 leaf or suffix will be added.  `unmatchedCh` is a character within `way`
that does not match a tree structure and it is `w`.  `unmatchedChIndex` is an index of an
unmatched character and it is `0`.  `offsetWithinEdge` is an important control variable
that indicates how many characters to offset within an edge (that matches a part of a
string) before splitting it in order to add a new leaf.  For this iteration, no edge
matched a part of the `way` string and therefore the `offsetWithinEdge` is `0`.  This
means that a new edge will be added directly to the `node`, which, for this scenario, is
the root node.

The addition is done by `addLeaf()` method that inserts a `w`-starting edge to the root.
An edge information is a four-part array that contains a word identifier (`0`), edge
starting index (`unmatchedChIndex` of `0`), word length (`3`), and an index from which
the full edge (from the root through the current edge) can be obtained (`0`).  Thus, the
inserted edge will be `[0, 0, 3, 0]`.  The array specifies to take a slice from index 0
up to (but not including) index 3 from the word with the identifier of 0. This would give
a string value of this edge, which is `way`.  To obtain the full edge, all the way from
the root, the word with an identifier of 0 is taken and a substring starting with the
index 0 is extracted.  This gives a full edge that is also `way`.  As the tree grows, the
edges like these are likely to get split.  This is why the fourth parameter, although
redundant in this case, is important to include. After the addition, the suffix tree
should look as follows.

*Suffix Tree After Adding the `w`-edge*
```
{
  edges: {
    w: [0, 0, 3, 0]
  }
}
```

`matchAndAddLeaves()` returns an index of the next character within a string (that is
being added) from which a match is to be made against a tree.  The next character index
equals to `leavesToAdd` added to the currently used index, i.e., 1 `leavesToadd` plus 0
(index of `w`) gives the next index of 1.

Next, `matchAndAddLeaves()` attempts to match the `ay` part of the `way` string against
the tree.  No match is found and `getNewLeafInfo()` provides `leavesToAdd` of 1,
`unmatchedCh` of `a`, `unmatchedChIndex` of `1`, `offsetWithinEdge` also of `0`, and the
`node` is still the root.  This information instructs to add the `a`-starting edge
directly to the root node.  `matchAndAddLeaves()` then returns the next character index
of 2 - current index of 1 plus `leavesToAdd` of 1.  Going with the new index,
`matchAndAddLeaves()` seeks to match the `y` part of the `way` inside the suffix tree.
No match exists (yet again) and the `y`-starting path has to be added directly to
the root node.  The `matchesAndLeaves()` returns the next character index of 3 that goes
beyond the last character index of the word and `addString()` completes.  After adding
all of the suffixes of the first word `way`, the suffix tree should look as follows.

*Suffix Tree After Adding Word `way`*
```
{
  edges: {
    w: [0, 0, 3, 0],
    a: [0, 1, 3, 1],
    y: [0, 2, 3, 2]
  }
}
```

### Addition of a Word that Contains Some of its Suffixes in a Tree

The next word to add is `ways`.  Beginning with the first character `w`, `suffixer`
attempts to match as much of `ways` as possible within the tree.  `getNewLeafInfo()`
starts from the root node and proceeds to match its entire `w`-edge.  The function will
produce the following already-described data: `leavesToAdd` of 3, because 3 characters of
`ways` matched within the tree, `unmatchedCh` of `s`, `unmatchedChIndex` of 3,
`offsetWithinEdge` of 3, and the root `node`.  `getNewLeafInfo()` will also return the
following new data: `edge`, `edgeKey`, and `unmatchedEdgeCh`.  `edge` is the deepest edge
(i.e., `[0, 0, 3, 0]`) within which the final part of a string match was made. This datum
is provided for convenience purposes to minimize edge map reads.  `edgeKey` is a
character key within the returned node that references the provided `edge`.  Sometimes,
when a new suffix is added, an existing edge information has to be modified and written
back to the map.  This operation requires a reference key.  `unmatchedEdgeCh` is a
character of the edge that did not align with the `unmatchedCh` of the string that is
being added.  All of the characters of the existing `w`-edge were matched, because the
edge fully represents the previously added word `way`.  The `unmatchedEdgeCh` is
therefore `undefined` because, in this case, the `unmatchedCh` of `s` occurs just beyond
the length of the `w`-edge.  Use of `undefined`s is an important convention.  At the end
of every string there is an implicit `undefined` available natively in JavaScript.
`undefined`, as a language primitive, will never occur in a string as is.  This is why
`suffixer` does not use any special characters (e.g., `$`) to mark word endings.
Encountering  `unmatchedCh` and/or `unmatchedEdgeCh` as `undefined` indicates that a word
ending(s) must be added.

The `w`-edge has to be split to add a node that will include the `ways` suffix.  The
first thing that must be determined is a point within an existing edge where a separation
must occur.  The point is calculated by taking an edge's starting index and adding an
`offsetWithinEdge` to it.  For this case, the edge information stays the same, i.e.,
starting index of `0` plus `offsetWithinEdge` of `3` gives the same ending index of `3`.
An insertion of a node at the end of an edge is required because the edge would now lead
to two leaves.  The `unmatchedEdgeCh` is `undefined` and instructs `suffixer` to add the
endings map to the newly created node.  The endings are stored under the `ends` key.  The
endings' map's key is a string identifier and a value is an index within the identified
string from which the ending begins.  The word `way` (identifier of 0) ends with the
`way` suffix and that ending begins at index 0.  The latter value was the fourth
parameter in the previous entry for the `w`-edge (i.e., `[0, 0, 3, 0]`).  The
`unmatchedCh` is not `undefined`, but is an actual character `s`.  This tells `suffixer`
to create the edges entry under the new node.  Within the edges map, the `s`-edge is
added.  This edge is a leaf and represented by the array `[1, 3, 4, 0]`.  Again, the first
parameter is a string identifier.  The next two are the edge's starting index (indicated
by `unmatchedChIndex` of `3`) and the length of a string.  The fourth value is an index
(within an identified text) from which the full edge, beginning from the root, can be
obtained.

*Suffix Tree After Adding the Suffix `ways`*
```
{
  edges: {
    w: [0, 0, 3, {
      edges: {
        s: [1, 3, 4, 0]
      }
      ends: {0: 0},
    }],
    a: [0, 1, 3, 1],
    y: [0, 2, 3, 2]
  }
}
```

After the `ways` suffix is added, this call of `matchAndAddLeaves()` still has two other
suffixes to add, because the number of `leavesToAdd` was initially `3`.  Before the next
iteration starts, `matchAndAddLeaves()` "remembers" the reference of the newly created
node and then adjusts the information that guides the addition of the next suffix.
Regarding the latter, in this scenario, the `node` is still set to the root node,
`edgeKey` is set to the next character `a`, and `offsetWithinEdge` is decremented by `1`
to `2`.  Note that the `unmatchedCh` and `unmatchedEdgeCh` remain unchanged for the
duration of the `matchAndAddLeaves()` call.  Before the next addition starts,
`updateNewLeafInfo()` is called to further "normalize" the information that will guide
the creation of the next suffix.  As suffixes are added, during a `matchAndAddLeaves()`
call, each subsequent suffix's entirety gets closer and closer to the root node (because
suffixes get shorter).  Consequently, the new leaf information (e.g., `offsetWithinEdge`,
`node`) may need further adjustment to properly guide the addition of the next suffix.
Suppose that adding some first suffix entailed a direct insertion of an
`unmatchedCh`-edge into a node.  As subsequent suffixes are added, one may find that an
edge that starts with an `unmatchedCh` already exists under a node.  Or, an
`offsetWithinEdge` may be updated to, say, `4`, yet an appropriate edge, within which a
split has to be made, may have a length of, say, only `2`.  Such situations are
common-place as a generalized suffix tree grows.  This requires suffix insertion
information adjustments and `updateNewLeafInfo()` accomplishes that.  The function is
different from `getNewLeafInfo()` in that it does not traverse a suffix tree by comparing
edge characters to string characters.  Instead, when an `offsetWithinEdge` is greater
than 0, `updateNewLeafInfo()` navigates a suffix tree by "hopping" over the entire edges.
This allows updating the appropriate insertion information faster.  The function is
similar to Ukkonen's `canonize()` procedure.

For this iteration, `updateNewLeafInfo()` will only adjust the `edge`.  The insertion
information for the next addition is the following: root `node`, `a` `edgeKey`, `edge` of
`[0, 1, 3, 1]`, and `offsetWithinEdge` of `2`.  The `unmatchedCh`, `unmatchedChIndex`,
and `unmatchedEdgeCh` stay the same `s`, `3`, and `undefined`, respectively.  The same
approach used to add the previous suffix is applied here.  A new node is added at the end
of the `a`-edge.  Within the node the new ending and the edge are inserted.  Their data
are the same as previous ones with the exception of indices for the ending and the edge.
The `ay` ending will begin at index `1` of the first string.  The full edge `ays` will 
start at index `1` of the second string.  Recall that after the first insertion
`suffixer` "remembered" the reference to the created node.  A suffix link entry will be
made on that node such that it points to the node that was just created in this
iteration.  The node prefixed with the `way`-edge has a reference to the node prefixed
with the `ay`-edge, establishing a suffix link.

*Suffix Tree After Adding the Suffix `ays`*
```
{
  edges: {
    w: [0, 0, 3, {
      edges: {
        s: [1, 3, 4, 0]
      },
      ends: {0: 0},
      link: [reference to the 'ay'-edge node]
    }],
    a: [0, 1, 3, {
      edges: {
        s: [1, 3, 4, 1]
      },
      ends: {0: 1}
    }],
    y: [0, 2, 3, 2]
  }
}
```

After the `ays` suffix is added, this call of `matchAndAddLeaves()` still has one more
suffix to add.  Before the next iteration begins, `matchAndAddLeaves()` stores the
reference of the latest created node and then adjusts the insertion information by
setting `node` to root, `edgeKey` to `y`, and `offsetWithinEdge` to `1`.  A call to
`updateNewLeafInfo()` provides the only additional update by fetching the `y` `edge` from
the root node.  Using this data, a new node is created at the end of the `y`-edge.  Just
like during the previous two additions, one ending and one edge are inserted into the new
node.  A link entry also added to the previously created node that points to the node
instantiated currently.  The `y`-edge now is one character long and has a child node.
`suffixer` optimizes such paths by removing the array representation and directly linking
an edge key to its node.  This approach saves space and improves tree traversal
performance.

*Suffix Tree After Adding the Suffix `ys`*
```
{
  edges: {
    w: [0, 0, 3, {
      edges: {
        s: [1, 3, 4, 0]
      },
      ends: {0: 0},
      link: [reference to the 'ay'-edge node]
    }],
    a: [0, 1, 3, {
      edges: {
        s: [1, 3, 4, 1]
      },
      ends: {0: 1},
      link: [reference to the 'y'-edge node]
    }],
    y: {
      edges: {
        s: [1, 3, 4, 2]
      },
      ends: {0: 2}
    }
  }
}
```

All of the leaves that needed to be added during this call of `matchAndAddLeaves()` have
been inserted.  The function completes and returns the next character index of `3`
(previous index of `0` plus the initial `leavesToAdd` of `3`).  Within `addString()`, 
`matchAndAddLeaves()` is called afresh to see how much of the `ways` string beginning
with the character `s` matches against the tree.  There is no `s`-edge under the root
node.  The edge is then added by the `addLeaf()`.

*Suffix Tree After Adding the Suffix `s`*
```
{
  edges: {
    w: [0, 0, 3, {
      edges: {
        s: [1, 3, 4, 0]
      },
      ends: {0: 0},
      link: [reference to the 'ay'-edge node]
    }],
    a: [0, 1, 3, {
      edges: {
        s: [1, 3, 4, 1]
      },
      ends: {0: 1},
      link: [reference to the 'y'-edge node]
    }],
    y: {
      edges: {
        s: [1, 3, 4, 2]
      },
      ends: {0: 2},
    },
    s: [1, 3, 4, 3]
  }
}
```

### Addition of Suffixes Using Suffix Links

The next string on the list to add is `say`.  Only the first character `s` matches a
single-character `s`-edge under the root node.  The insertion information is similar to
the previous additions and a new node is created with one ending and one edge.  Because
the `s`-edge is only one character long, `suffixer` will remove the edge's array
representation and replace it directly with the newly created edge node.

*Suffix Tree After Adding the Suffix `say`*
```
{
  edges: {
    w: [0, 0, 3, {
      edges: {
        s: [1, 3, 4, 0]
      },
      ends: {0: 0},
      link: [reference to the 'ay'-edge node]
    }],
    a: [0, 1, 3, {
      edges: {
        s: [1, 3, 4, 1]
      },
      ends: {0: 1},
      link: [reference to the 'y'-edge node]
    }],
    y: {
      edges: {
        s: [1, 3, 4, 2]
      },
      ends: {0: 2}
    },
    s: {
      edges: {
        a: [2, 1, 3, 0]
      },
      ends: {1: 3}
    }
  }
}
```

After adding the `say` suffix, `matchAndAddLeaves()` returns the next character index of
`1`.  The next call to the function and its call to `getNewLeafInfo()` will fully match
the remaining `ay`-part of the word against the tree and provide the following insertion
information.  `leavesToAdd` is `2`.  The `node` will no longer be the root, but rather
the node at the end of the `a`-edge, because the entire `a`-edge was matched.
`offsetWithinEdge` is `0` because character matching ended on the edge node.
`unmatchedCh` is `undefined` because all of the string characters that needed to be
matched already occur within a tree.  Recall that `undefined` implicitly indicates a word
ending.  Therefore, under the endings' entry of the `node`, `addLeaf()` adds a string
identifier of `2` linked to the current character index.  Index of the current character
`a` is `1`.  Note that a character index that is passed to `matchAndAndLeaves()` is
incremented with every suffix added.

*Suffix Tree After Adding the Suffix `ay`*
```
{
  edges: {
    w: [0, 0, 3, {
      edges: {
        s: [1, 3, 4, 0]
      },
      ends: {0: 0},
      link: [reference to the 'ay'-edge node]
    }],
    a: [0, 1, 3, {
      edges: {
        s: [1, 3, 4, 1]
      },
      ends: {0: 1, 2: 1},
      link: [reference to the 'y'-edge node]
    }],
    y: {
      edges: {
        s: [1, 3, 4, 2]
      },
      ends: {0: 2},
    },
    s: {
      edges: {
        a: [2, 1, 3, 0]
      },
      ends: {1: 3}
    }
  }
}
```

Following the addition of the `ay` suffix, there is still one more suffix to add.  During
the previous additions within `matchAndAddLeaves()`, after a suffix is added, the `node`
was automatically set to root with appropriate adjustments to `edgeKey` and other
parameters.  For this situation, the `node` that was initially selected has a suffix
link.  This allows updating the `node` by replacing it with its link.  This eliminates
traversal all the way from the root node in order to find the correct placement for the
next suffix.  Subsequent call to `updateNewLeafInfo()` will not change any information
and another ending will be added within the `y`-edged node by matching the string
identifier of `2` to the character index of `2`.  In other words, the `y` ending begins
at the second index of the third string `say`.

*Suffix Tree After Adding the Suffix `y`*
```
{
  edges: {
    w: [0, 0, 3, {
      edges: {
        s: [1, 3, 4, 0]
      },
      ends: {0: 0},
      link: [reference to the 'ay'-edge node]
    }],
    a: [0, 1, 3, {
      edges: {
        s: [1, 3, 4, 1]
      },
      ends: {0: 1, 2: 1},
      link: [reference to the 'y'-edge node]
    }],
    y: {
      edges: {
        s: [1, 3, 4, 2]
      },
      ends: {0: 2, 2: 2}
    },
    s: {
      edges: {
        a: [2, 1, 3, 0]
      },
      ends: {1: 3}
    }
  }
}
```

### Important Edge Cases When Building a Multi-String Suffix Tree

#### Existence of an Unmatched Character Starting Edge on One of the Nodes

The next string on the list is `yfere` (an old English word).  The word suffixes can be
fully added using the algorithm that was described so far.  The new suffix tree entries
of `yfere`, `fere`, `ere`, `re`, and `e` will be as follows.

*Suffix Tree Changes After Adding the String `yfere`*
```
{
  edges: {
    .
    .
    y: {
      edges: {
        s: [1, 3, 4, 2],
        f: [3, 1, 5, 0]
      },
      ends: {0: 2, 2: 2}
    },
    .
    .
    f: [3, 1, 5, 1],
    e: {
      edges: {
        r: [3, 3, 5, 2]
      },
      ends: {3: 4}
    },
    r: [3, 3, 5, 3]
  }
}
```

`wayfare` is the next word to be added.  Using the algorithm, the `node` under the
`way`-edge is obtained and the `fare` part of the word is inserted there as one of the
edges.

*Suffix Tree Change After Adding the Suffix `wayfare`*
```
{
  edges: {
    w: [0, 0, 3, {
      edges: {
        s: [1, 3, 4, 0]
        f: [4, 3, 7, 0]
      },
      ends: {0: 0},
      link: [reference to the 'ay'-edge node]
    }],
    .
    .
  }
}
```

Then, the `node` is overridden with its link value.  This sets the `node` to the node
that is under the `ay`-edge.  The same insertion conditions apply and the `fare` part
of the word is added as an edge within the `ay`-edged node.

*Suffix Tree Change After Adding the Suffix `ayfare`*
```
{
  edges: {
    .
    .
    a: [0, 1, 3, {
      edges: {
        s: [1, 3, 4, 1],
        f: [4, 3, 7, 1]
      },
      ends: {0: 1, 2: 1},
      link: [reference to the 'y'-edge node]
    }],
    .
    .
  }
}
```

The `ay`-edged node also has a link.  Replacing the `node` with the latter sets the
active `node` to the node under the `y`-edge.  The `y`-edged node, however, already has
an edge that starts with the character `f`.  This is why the function
`updateNewLeafInfo()` is necessary.  Initial suffix insertion data will change as
multiple suffixes are sequentially added within a single call of `matchAndAddLeaves()`.
Each subsequent suffix's entirety gets closer to the root node.  As a result, the
overlaps such as the one seen in this scenario are possible and common.  In order to
obtain the correct suffix insertion information, in this case, the `updateNewLeafInfo()`
will call the `getNewLeafInfo()` that will traverse the tree beginning with the active
node (i.e., `y`-edged node) and starting with the fourth character (`f`) of the string.
In such a situation, if an edge is split and a new node is created, a link **cannot** be
made to that new node.  Recall that each suffix link points to a node that is preceded by
only one character less (from the top).  That is, here, the `way`-edged node links to the
`ay`-edged node, and the latter links to the `y`-edged node.  The last link cannot be
changed such that the `ay`-edged node points to the newly created `y-f`-edged node.  For
such cases the `updateNewLeafInfo()` will also explicitly set the node that is to be used
in the linking chain.  Below, the `f`-edge within the `y`-edged node is correctly split to
have the `ere` and the `are` leaves for the `yfere` and `wayfare` words, respectively.
After the insertion is completed, the link of the `ay`-prefixed node should still point to
the node below the `y`-edge.

*Suffix Tree Changes After Adding the `yfare` Suffix*
```
{
  edges: {
    .
    .
    y: {
      edges: {
        s: [1, 3, 4, 2],
        f: {
          edges: {
            e: [3, 2, 5, 0], 
            a: [4, 4, 7, 2]
          }
        }
      },
      ends: {0: 2, 2: 2}
    },
    .
    .
  }
}
```

#### `offsetWithinEdge` Exceeding an Edge Length

Consider the following brand-new tree consisting of suffixes for the words `cleaner`,
`lab`, `let`, and `less`.

*Suffix Tree Constructed from `cleaner`, `lab`, `let`, and `less` Words*
```
{
  edges: {
    c: [0, 0, 7, 0],
    l: {
      edges: {
        e: {
          edges: {
            a: [0, 3, 7, 1],
            t: [2, 2, 3, 0],
            s: [3, 2, 4, 0]
          },
          link: [reference to the 'e'-edged node]
        },
        a: [1, 1, 3, 0]
      }
    },
    e: {
      edges: {
        a: [0, 3, 7, 2],
        r: [0, 6, 7, 5],
        t: [2, 2, 3, 1],
        s: [3, 2, 4, 1]
      }
    },
    a: {
      edges: {
        n: [0, 4, 7, 3],
        b: [1, 2, 3, 1]
      }
    },
    n: [0, 4, 7, 4],
    r: [0, 6, 7, 6],
    b: [1, 2, 3, 2],
    t: [2, 2, 3, 2],
    s: {
      edges: {
        s: [3, 3, 4, 2]
      }, 
      ends: {3: 3} 
    }
  }
}
```

Suppose that the suffixes of the new word `clean` need to be added to the tree.  Checking
the word against the structure would reveal that `clean` is wholly subsumed within the
root node's `c`-edge.  The insertion information would be as follows.  `leavesToAdd`
is `5`, because 5 characters matched against the tree.  `unmatchedCh` is `undefined`.
`offsetWithinEdge` is also 5.  `node` is root.  `edge` is `[0, 0, 7, 0]`.  `edgeKey`
is `c`.  And, `unmatchedEdgeCh` is `e`.  Using the information would result in the
following update of the `c`-edge.  The latter is split to record the ending of the word
`clean` and insert the edge that would complete the previous `cleaner` word.

*Suffix Tree After Adding the `clean` Suffix*
```
{
  edges: {
    c: [0, 0, 5, {
      edges: {
        e: [0, 5, 7, 0]
      },
      ends: {4: 0}
    }]
    .
    .  
  }
}
```

Previously selected `node` was root and, by definition, it has no links and is kept as
it is.  The `edgeKey` is set to the next character (`l`) and `offsetWithinEdge` is
decremented by `1` to `4`.  This indicates that the next suffix insertion is to happen
within the root node's `l`-edge at the depth of 4 characters.  The `l`-edge, however, is
only one character deep.  The `l`-edge's node's `e`-edge is also one character deep.  To
obtain the correct insertion information `updateNewLeafInfo()` will have to "hop" over
the edges that are shorter than the `offsetWithinEdge`.  With every edge "hop" the
`offsetWithinEdge` gets decreased by the edge's length.  When "hopping" over multiple
edges, within each edge's child node, a correct `edgeKey` has to be selected to keep the
"hopping" on a correct path that represents a suffix that is to be added.  `edgeKeyIndex`
control variable is used to accomplish that.  The parameter represents an index (within a
string that is being added) of the `edgeKey`.  When a "hop" happens a new `edgeKey` within
an edge's node is determined by taking `edgeKeyIndex`, adding edge length to it to obtain
the new `edgeKeyIndex`, and then accessing a character of an added string that is at that
new index.  This allows faster skipping over the edges without reading the entirety of an
edge, which is what `getNewLeafInfo()` does.

After two "hops", the `node` is set to the one under the `l`-`e`-edge.  `edgeKey` is set
to `a`.  `offsetWithinEdge` is adjusted to `2`.  `edge` is `[0, 3, 7, 1]`. `unmatchedCh`
remains the same at `undefined`.  And, `unmatchedEdgeCh` remains the same at `e`.  Using
the information one ending and one edge are added.  We can see, from the snippet below,
that `lean` suffix is an ending within the word `clean` correctly beginning at index 1.
And, `leaner` suffix occurs within the word `cleaner` starting at index 1.

*Suffix Tree After Adding the `lean` Suffix*
```
{
  edges: {
    .
    .
    l: {
      edges: {
        e: {
          edges: {
            a: [0, 3, 5, {
              edges: {
                e: [0, 5, 7, 1]
              },
              ends: {4: 1}
            }],
            t: [2, 2, 3, 0],
            s: [3, 2, 4, 0]
          },
          link: [reference to the 'e'-edged node]
        },
        a: [1, 1, 3, 0]
      }
    },
    .
    .
  }
}
```

## Conclusion

The multi-string online linear construction of suffix trees presented here is different
from Ukkonen's algorithm in the level of explication and, hopefully, also clarity of the
implemented process.  The functions were abstracted to their specific purpose and named
as precisely as was feasible.  There are no `s`, `k`, `p`, and `i` variables.  Instead,
there are `node`, `offsetWithinEdge`, `unmatchedCh`, etc.  There is no concept of an
active point, but rather a collective data state with various control variables that
guide the insertion of new suffixes and future updates to the said state.  Hopefully the
extra "verbosity" provides the extra traction to grasp the procedure.  The difficulty of
an overall algorithm gets compounded when various combinations of strings that compose a
tree are considered.  Other explanations of the approach predominantly focus on suffixing
just one string (e.g., `xyzxyaxyz`).  Documenting suffix additions of several strings in
a row into the same tree should more greatly clarify the algorithm's steps.  That clarity
should be further enhanced by the use of a tree data structure specifically designed to
store multiple texts.  The algorithm is not trivial.  Perhaps the explications here and
the [implementation itself](../src/suffixer.js) make the approach a little bit easier to
understand and to work with.
