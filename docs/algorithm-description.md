# Generalized Suffix Tree Construction

## Introduction

Ukkonen's suffix tree construction algorithm, in its [academic format](./ukkonen-1995-on-line-construction-of-suffix-trees.pdf),
is unlikely to be readily accessible for most readers.  The terminology employed plus the
terseness of the language make it challenging to understand and implement an otherwise
interesting approach.  Probably the most helpful resources are videos that take one
step by step through a suffix tree construction: [video 1](https://www.youtube.com/watch?v=yg8Rkv8WLSg)
and [video 2](https://www.youtube.com/watch?v=aPRqocoBsFQ).  Many such instructionals
adopt the original terminology (e.g., active point) and are predominantly single-string
focused.  The distinct purpose of this write-up is to provide a step-by-step outline of
generalized (i.e., multi-string) suffix tree construction.  The differentiating and
hopefully a helpful feature of this explanation is its highlighting of the changes in an
actual underlying data structure rather than a visualization of the expanding suffix tree.

## Prerequisites

### Basic Terminology

A `tree` is a hierarchical data structure consisting of `nodes` and `edges`.  A `node` is
a juncture point out of which the `edges` originate.  An `edge` is branch that links a
`node` to another `node`.  Such connecting `edges` are called stems.  An `edge` that does
not lead to another `node` and instead stands on its own is called a `leaf`.

### Generalized Suffix Tree Data Structure

Besides a `node` and an `edge`, `suffixer` also uses concepts of an `ending` and a `link`.
A node can have a collection of `ending`s.  The latter is a map that records which strings
(in a suffix tree) end with a substring represented by a total edge that goes from the top
of a tree (i.e., from root node) all the way through to the node that has the `ending`s'
entries.  The map links an identifier of a string to the character index of the string from
which the `ending` starts.  A suffix `link`, if possible, should connect a node to another
node, laterally, such that the total edge above the second node is exactly one character less
(from the top) compared to the total edge leading to the first node.  For example, if the
total edge before the first node is `wayfare`, then that node should link to a node whose
total edge is `ayfare`.  For more details, please see the following explanation of the
[suffix tree data structure](./suffix-tree-data-structure.md).

## Algorithm Description

### Initial Data Structure

Suppose we want to build a multi-string suffix tree consisting of words: `way`, `ways`, `say`, and
`lag`.  At the beginning of this process, the suffix tree is the following empty data structure
where the root node contains an empty map (`e`) for its children edges.

*Starting Suffix Tree Data Structure*
```
{
  e: {}
}
```

### Addition of a Word that has None of its Suffixes in a Tree

The first word to add is `way` and the `addString()` method within `suffixer` starts the process.
The function pushes the word to a strings array and gets an integer identifier for the word (`0` to
start).  Then, beginning from the first character (`w`) the `matchAndAddLeaves()` function attempts to
find how many characters of the `way` string are already represented in the tree.  `getNewLeafInfo()`
internal method is used to follow the structure starting, in this case, from the root.

`getNewLeafInfo()` returns information, gathered during a tree traversal, that guides the addition of new
suffixes into the tree.  During that first call `getNewLeafInfo()` should determine that not a single
character of the word `way` starting with `w` matches any part of the tree because the tree is empty.
The function can return up to eight pieces of control data.  For this iteration the relevant are the
following five: `leavesToAdd`, `unmatchedCh`, `unmatchedChIndex`, `offsetWithinEdge`, and `node`.
`leavesToAdd` will be at least 1 and it can equal to the number of characters of a string that match
against a tree.  The number of matches equals the number of new suffixes that will be added.  In this
case, since none of the characters are matched, only 1 leaf or suffix will be added during this call
of `matchAndAddLeaves()`.  `unmatchedCh` is a character within `way` that did not match a tree structure
and it is `w`.  `unmatchedChIndex` is an index of an unmatched character and it is `0`.  `offsetWithinEdge`
is an important control variable indicates how many characters to offset within an edge (that matches
a part of a string) before splitting it in order to add a new leaf.  For this iteration, no edge matched
a part of the `way` string and therefore the `offsetWithinEdge` value is `0`.  That means that a new
edge will be added directly to the `node`, which, for this iteration, is a root node.  The addition is
done by `addLeaf()` method that inserts a `w`-starting edge to the root.  The edge information is an
four-part array that contains a word identifier, edge starting index, word length, and an index from
which the full path/edge (from the root through the current edge) can be obtained.  The edge of
`[0, 0, 3, 0]` specifies to take a slice from index 0 up to (but not including) index 3 from word with
an identifier of 0.  This would give a string value of this edge, which is `way`.  To obtain the full
edge all the way from the root, we take word with an identifier of 0 and take a substring starting with
the index 0.  This gives a full edge that is also `way`.  As the tree grows, the edges like these are likely
to get split.  This is why the fourth parameter, although redundant in this case, is important to include.
After the addition, the suffix tree should look as follows.

*Suffix Tree After Adding `w`-edge*
```
{
  e: {
    w: [0, 0, 3, 0]
  }
}
```

`matchAndAddLeaves()` returns an index of the next character within a string from which a match
is to be made against a tree.  The next character index equals to `leavesToAdd` added to the
currently used index, i.e., 1 `leavesToadd` plus 0 (index of `w`) gives the next index of 1.

Next, `matchAndLeaves()` attempts to match the `ay` part of the `way` string against the tree.
No match is found and `getNewLeafInfo()` provides `leavesToAdd` of 1, `unmatchedCh` of `a`,
`unmatchedChIndex` of 1, `offsetWithinEdge` also of 0, and the `node` is still the root.  This
information instructs to add the `a`-starting edge directly to the root node.  `matchAndLeaves()`
then returns the next character index of 2 - current index of 1 plus `leavesToAdd` of 1.  Going
with the new index, `matchAndLeaves()` seeks to match the `y` part of the `way` inside the
suffix tree.  No match exists (yet again) and the `y`-starting path has to be added directly to
the root node.  The `matchesAndLeaves()` returns the next character index of 3 that goes beyond
the last character index of the word and `addString()` completes.  After adding all of the suffixes
of the first word `way`, the suffix tree should look as follows.

*Suffix Tree After Adding Word `way`*
```
{
  e: {
    w: [0, 0, 3, 0],
    a: [0, 1, 3, 1],
    y: [0, 2, 3, 2]
  }
}
```

### Addition of a Word that has Some of its Suffixes in a Tree

The next word to add is `ways`.  Beginning with the first character `w`, suffixer attempts to
match as much of `ways` as possible within the tree.  `getNewLeafInfo()` starts from the root
node and proceeds to match the entire `w`-edge.  The function will produce the following
already-described data: `leavesToAdd` of 3, because 3 characters of `ways` matched within the
tree, `unmatchedCh` of `s`, `unmatchedChIndex` of 3, `offsetWithinEdge` of 3, and root `node`.
`getNewLeafInfo()` should also return the following new data: `edge`, `edgeKey`, and `unmatchedEdgeCh`.
`edge` is the deepest edge (i.e., `[0, 0, 3, 0]`) within which the final part of a string match was made.
This datum is provided for convenience purposes to minimize edge map reads.  `edgeKey` is a character
key within the returned node that references the provided `edge`.  Sometimes when a new suffix is added,
an existing edge information has to be modified and written back to the map.  This operation requires
a reference key.  `unmatchedEdgeCh` is a character of the edge that did not align the `unmatchedCh` of
the string that is being added.  All of the characters of the existing `w`-edge were matched, because
`w`-edge represented a previously added word `way`.  The `unmatchedEdgeCh` is therefore `undefined` in
this case.  This is an important convention.  At the end of every word there is an implicit `undefined`
that is natively available in JavaScript.  This is why `suffixer` does not use any special characters
(e.g., `$`) to mark word endings.  In this case, the first three characters of `ways` matches an existing
word `way`.  The unmatched character `s` is at 

