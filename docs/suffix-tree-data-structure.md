# `suffixer`

## Suffix Tree Data Structure

Suppose that a suffix tree has to store the following words: `way` and `ways`.  The words
have these suffixes: `way`, `ay`, `y`, `ways`, `ays`, `ys`, and `s`.  Each suffix has to
be locatable from the top of a tree (i.e., from the root node).  Because each suffix starts
with one of the four distinct letters (`w`, `a`, `y`, and `s`), the root node should have
four unique edges leading to all 7 suffixes (see example data structure at the end of the
section).

Each edge node (including root) is a plain object (`{}`) that `suffixer` creates and can have
up to three entries: `c`, `e`, and `l`.  `c` contains children edges.  `e` stores string endings.
And `l` holds a suffix link.  It is not advisable to have one-character property names or variables.
This naming convention was born by practicality.  It is less verbose to directly access a part
of the tree using the following path `tree.root.c.get('s').c.get('t').c.get('a')` versus using
the full spelling: `tree.root.children.get('s').children.get('t').children.get('a')`.

The root node has only children edges entry.  The `c` is a JavaScript `Map` where key is the
first character of the edge and the value is the edge information or just the edge's child node.
If an edge length is at least 2 characters, then edge information is an array.  Or, if an edge
is a leaf (has no branches below it), then it can be 1 character long and still be expressed
as an array.  Consider `s` entry under the root's edge children.  The corresponding `s` value
is `[1, 3, 4, 3]`.  The first number in the array is a string identifier.  The word `ways` is
stored second, therefore its identifier is 1. The second and third values are start and end
indices of the designated string that would give us an entire string version of an edge.  In
this case, within a word with the identifier of 1 we start at the fourth character (index of 3)
and go until (but not including) the fifth character (index of 4).  This string slice from index
3 to 4 would be `s`.  The fourth number in the array is an index within a specified string from
which an entire string path (from the root to the present edge) can be obtained.

Consider `w` entry under root's edge children.  Its edge information is `[0, 0, 3, [edge child node]]`.
The full edge is found by taking word 0 (i.e., `way`) and extracting a substring from 0 to 3 
(not including) to obtain a slice `way`.  When a suffix `ways` is added, the root's `w` edge 
has to be traversed in its entirety.  The text `ways` goes beyond `way`, therefore a child
node has to be created under `way` edge.  The edge child node has its own edge children entry (`c`)
with the only child `s` whose edge information is `[1, 3, 4, 0]`.  The latter tells us that
the edge string value is `s` (i.e., substring from index 3 to 4 of string 1).  However, the
entire string path up to this point and from the top of the tree can be obtained by taking a
substring from index 0 of word 1.  That is, from the index of 0 of string 1, a full word `ways`
is obtained.

The child node of the root's `w` edge also has the `e` (endings) entry.  The latter is a map
that stores information on strings whose endings match the entire string path (from the root
through the present edge). The map's key is a string identifier and a value is an index within
the identified string from which the ending begins.  In this case, the edge `way` is the ending
of string 0 and that ending begins at index 0.  In other words, `way` is an ending of `way` from
the very start of the word.  If we look at the root's `a` edge, its full string value is `ay` -
substring from indices 1 to 3 of text 0.  The `a`'a child node also has `e` endings entry.  The
string identifier is also 0; however, the ending `ay` within the word `way` correctly begins at
index 1.

When an edge is a character long and has a child node, `suffixer` removes array representation and
associates the child node directly with the edge.  In this example, the root's `y` edge is a single
character and it is linked to its child node.  In generalized trees that hold a lot of strings this
convention is a space and processing saver.  The closer to the root the edges (within their nodes) are,
the more likely that they will be a character long, therefore not requiring the extra memory and
processing when traversing a tree.

The last entry that edge child nodes can have is a suffix link (`l`).  The root's `w` edge has
a child node with a link to the node that is under the root's `a` edge.  The node under the root's `a`
edge has a link to the node under the root's `y` edge.  In other words, the node under `way` has a
link to the node under `ay`.  The node under `ay` has a link to the node under `y`.  The purpose of a
suffix link is to enable a transition to a node that is under a string that is one character less
(from the top) than the string under which a node with the suffix link falls.  In this case, there
can be a transfer from `way` to `ay` to `y` nodes.

***Example:*** `suffixer`'s Data Structure for Words `way` and `ways`
```
{
  c: Map(4) {
    'w' => [ 0, 0, 3, {
      e: Map(1) { 0 => 0 },
      c: Map(1) { 's' => [ 1, 3, 4, 0 ] },
      l: [reference to the node under 'ay' edge (from the root)]
    }],
    'a' => [ 0, 1, 3, {
      e: Map(1) { 0 => 1 },
      c: Map(1) { 's' => [ 1, 3, 4, 1 ] },
      l: [reference to the node under 'y' edge (from the root)]
    }],
    'y' => {
      e: Map(1) { 0 => 2 },
      c: Map(1) { 's' => [ 1, 3, 4, 2 ] }
    },
    's' => [ 1, 3, 4, 3 ]
  }
}
```
