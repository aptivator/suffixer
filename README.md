# `suffixer`

## Table of Contents

* [Introduction](#introduction)
* [Installation](#installation)
  * [Installing the Library](#installing-the-library)
  * [Distributed Versions](#distributed-versions)
* [Usage](#usage)
  * [Building a Suffix Tree](#building-a-suffix-tree)
    * [Instantiating a Suffix Tree](#instantiating-a-suffix-tree)
    * [Augmenting a Suffix Tree](#augmenting-a-suffix-tree)
  * [Changing Suffix Tree Configurations](#changing-suffix-tree-configurations)
  * [Querying a Suffix Tree](#querying-a-suffix-tree)
    * [Selecting Strings that Include a Substring](#selecting-strings-that-include-a-substring)
    * [Finding Strings that Start with a Substring](#finding-strings-that-start-with-a-substring)
    * [Locating Strings that End with a Substring](#locating-strings-that-end-with-a-substring)
    * [Searching Strings that Exclude a Substring](#searching-strings-that-exclude-a-substring)
    * [Getting Strings that Equal to a Search String](#getting-strings-that-equal-to-a-search-string)
    * [Determining the Longest Repeating Substring](#determining-the-longest-repeating-substring)
    * [Isolating the Longest Common Substring](#isolating-the-longest-common-substring)
* [Development](#development)
  * [Development Setup](#development-setup)
  * [Contributing Changes](#contributing-changes)
  * [Potential New Features](#potential-new-features)
* [Implementation Details](#implementation-details)
* [Performance](#performance)
* [Caveats](#caveats)

## Introduction

`suffixer` adopts Ukkonen's algorithm to build generalized (i.e., multi-string)
suffix trees.  The latter are cornerstone data structures for text analysis.
The library implements a heuristic approach that organizes each tree construction
operation topically in accordance with the operation's purpose.  Suffix tree
algorithms are not the easiest to understand and build.  "Intuitive" arrangement
is employed to make the implementation more understandable.  `suffixer` is not just
an educational or a demonstration utility.  The library was written primarily for
production and uses a number of optimizations to efficiently build and query suffix
trees.  For example, multiple strings are handled without separators and are stored
individually.  This makes augmenting and searching a tree only a matter of traversal
devoid of extraneous delimiter-related steps.  For performance reasons, `Map`s,
instead of plain objects (`{}`), are used to store edges' (paths between nodes) and
string endings' information.  Edges that have a child node and are 1-character long
are represented only as a character key in a respective map without other information
such as edge's start, stop, and string identifier.  `suffixer` also works with "complex"
characters (e.g., emojis) that take multiple bytes of storage.

## Installation 

### Installing the Library

To fetch the library, run the following command.

```
npm install --save suffixer
```

### Distributed Versions

`suffixer`'s default import is either an EcmaScript (ES) or a CommonJS (as an UMD) module
that bundles the source code without transpilation.  The library makes use of private
class methods, latest native methods (e.g., `Array`'s `isArray`, `Object.hasOwn`), and
data structures such as `Set` and `Map`.  The defaults are provided as such with the
expectation that `suffixer` will be augmented as a dependency to a host project that,
in turn, will be transpiled for some target environment or used, as is, in a browser or
server-side environment (e.g., Node 20+) that supports the utilized language features.

For those rare circumstances when `suffixer` has to be utilized in older backend
environments or included in a larger bundle without transpilation (for older browsers),
the EcmaScript 5 distributable is available from `suffixer\es5`.

## Usage 

### Building a Suffix Tree

#### Instantiating a Suffix Tree

`suffixer`'s default export is `Suffixer` class.  The latter can be instantiated with a
string or an array of strings that will compose a suffix tree.  `Suffixer()` can also be
called with configurations that affect how query results are presented.  Two settings
are available: `returnStrings` and `includeIndices`.  Both of these are `true` by default.
Setting `returnStrings` to `false` will return a string identifier.  `includeIndices` as
`false` instructs `suffixer` to exclude string indices at which a matched search string
begins.

*Instantiating a Blank Suffix Tree*
```javascript
import {Suffixer} from 'suffixer';

let tree = new Suffixer();
```

*Creating a Suffix Tree with a String*
```javascript
let string = 'abracadabra';
let tree = new Suffixer(string);
```

*Initializing a Suffix Tree with an Array of Strings*
```javascript
let strings = ['way', 'ways'];
let tree = new Suffixer(string);
```

*Invoking a Suffix Tree with Configurations*
```javascript
let configs = {includeIndices: false};
let tree = new Suffixer(configs);
```

*Getting a Suffix Tree with Strings and Configurations*
```javascript
let strings = ['way', 'ways'];
let configs = {returnStrings: false};
let tree = new Suffixer(strings, configs);
```

#### Augmenting a Suffix Tree

`suffixer` is an online implementation and allows suffix trees to be expanded after
instantiation.  The library makes available `addString` and `addStrings` methods to
add a string or an array of string to an already-created tree.

*Adding a String to a Suffix Tree*
```javascript
let configs = {includeIndices: false};
let tree = new Suffixer(configs);
tree.addString('way');
```

*Adding Strings to a Suffix Tree*
```javascript
let configs = {includeIndices: false};
let strings = ['way', 'ways'];
let tree = new Suffixer(configs);
tree.addStrings(strings);
```

### Changing Suffix Tree Configurations

The library provides `setConfigs` method to override configurations after a
suffix tree is instantiated.

*Overriding Configurations*
```javascript
let strings = ['way', 'ways'];
let tree = new Suffixer(strings);
tree.setConfigs({returnStrings: false});
```

### Querying a Suffix Tree

#### Selecting Strings that Include a Substring

`includes()` searches a suffix tree for a string pattern.  If successful, the
method returns an array of results.  Each result is an array containing a string
that includes a searched-for substring plus indices at which a pattern occurs.
When nothing is found, the function returns an empty array.  `includes()` also
takes an optional configurations' parameter that just for the method's invocation
will override a tree's global settings.

*Selecting Strings that Include a String Pattern*
```javascript
let strings = ['radar', 'bay'];
let tree = new Suffixer(strings);
let results = tree.includes('a'); // [['radar', [1, 3]], ['bay', [1]]]
```

*Passing an Optional Configurations Object*
```javascript
let strings = ['radar', 'bay'];
let tree = new Suffixer(strings);
let results = tree.includes('a', {returnStrings: false}); // [[ 0, [1, 3]], [1, [1]]]
```

*Returning an Empty Array when There is No Match*
```javascript
let strings = ['radar', 'bay'];
let tree = new Suffixer(strings);
let results = tree.includes('stop'); // []
```

#### Finding Strings that Start with a Substring

`startsWith()` searches for strings that begin with a specified pattern.  When
a search is fruitful, the function returns an array of matches.  No indices are
provided.  By implication a pattern would start at an index of 0.  The method also
takes a configurations' parameter that can instruct to return only string identifiers.
When no matches are found, an empty array is produced.

*Selecting Strings that Start with a Pattern*
```javascript
let strings = ['way', 'ways'];
let tree = new Suffixer(strings);
let results = tree.startsWith('wa'); // ['way', 'ways']
results = tree.startsWith('ay'); // []
```

#### Locating Strings that End with a Substring

`endsWith()` will attempt to locate strings whose ending matches a search
string.  When there are search results, the method outputs a matched string
and an index at which the ending begins.  An empty array is returned when
no strings match a query.  `endsWith()` can also override default configurations
to return strings and indices.

*Locating Strings that end With a Pattern*
```javascript
let tree = new Suffixer(['way', 'ways']);
let results = tree.endsWith('ay'); // [['way', 1]]
results = tree.endsWith('ly') // []
```

#### Searching Strings that Exclude a Substring

`excludes()` uses `includes()` internally to find all strings that
match a search string and then removes these strings' identifiers
from a set of all string identifiers.  Given this approach, `excludes()`
is the second slowest query function.  Performance tests show that finding
words out of 370105 that exclude a character `a` takes a little over a second.
Results of course will vary depending on the hardware.  The function
returns just the strings or string identifiers that do not have a search
pattern or an empty array when there are no exclusion results.

*Searching Strings that Do not Include a Pattern*
```javascript
let tree = new Suffixer(['way', 'ways', 'silly']);
let results = tree.excludes('a'); // ['silly']
results = tree.excludes('y'); // []
```

#### Getting Strings that Equal to a Search String

`equals()` provides all strings that exactly match the search string.
The method returns only the strings, string identifiers or an empty
array when there is no match.

*Getting Strings that Are an Exact Match*
```javascript
let tree = new Suffixer(['way', 'ways', 'silly']);
let results = tree.equals('way', {returnStrings: false}); // [0]
```

#### Determining the Longest Repeating Substring

`findLongestRepeating()` looks for a longest substring that occurs more
than once.  The function will error if a tree is built with more than one
distinct string.  When successful, the method produces an object that contains
a repeating substring plus indices at which the substring starts.  Running
this search on a string without repeats will return `undefined`.

*Looking for the Longest Repeating Substring*
```javascript
let tree = new Suffixer('abracadabra');
let results = tree.findLongestRepeating(); // {indices: [7, 0], repeating: 'abra'}
```

*Locating Single Character Repeats*
```javascript
let tree = new Suffixer('dmitriy');
let results = tree.findLongestRepeating(); // { indices: [2, 5], repeating: 'i' }
```

*Returning `undefined` When no Repeats Exist*
```javascript
let tree = new Suffixer('abcdef');
let results = tree.findLongestRepeating(); // undefined
```

#### Isolating the Longest Common Substring

`findLongestCommon()` will attempt to find the lengthiest common substring across
all strings that are in a suffix tree.  If such a substring exists, the function
returns an object with `strData` and `common` entries.  `strData` is an array of
words plus indices for each word at which the common substring begins.  It is
possible for a word to have more than one substring that occurs across all words
in a tree.  `common` is the actual substring.  `findLongestCommon()` is the slowest
query function.  It finds the deepest internal nodes and walks up to their parents
until an internal node is encountered under which various suffixes of all strings
fall.  Performance tests show that finding a common substring across 5000 words
takes less than 0.1 seconds.  The method outputs `undefined` when no common substring
exists.

*Isolating the Longest Shared String*
```javascript
let tree = new Suffixer(['way', 'ways', 'abracadabra', 'saint']);
let results = tree.findLongestCommon();
console.log(results);
/*
  {
    strData: [
      ['abracadabra', [10, 3, 5, 7, 0]],
      ['saint', [1]],
      ['way', [1]],
      ['ways', [1]]
    ],
    common: 'a'
  }
*/
```

## Development

### Development Setup 

Perform the following steps to setup the repository locally.

```
git clone https://github.com/aptivator/suffixer.git
cd suffixer
npm install
```

To start development mode run `npm run dev` or `npm run dev:coverage`.

### Contributing Changes

The general recommendations for contributions are to use the latest JavaScript
features, have tests with complete code coverage, and include documentation.
The latter may be necessary only if a new feature is added or an existing documented
feature is modified.

### Potential New Features

Suffix trees can be used for a wide variety of applications such as compression, least
common extension, string approximation, and suffix array construction to name a few.  Over
time some of these features will be added.

## Implementation Details

Those interested in details of the algorithm used should first get acquainted
with the [data structure](./docs/suffix-tree-data-structure.md) that this
implementation uses to store a generalized suffix tree.  [Algorithm description](./docs/algorithm-description.md)
can be read next.

## Performance

A variety of tests are provided to gauge `suffixer`'s performance.  Code from 
[suffix-tree-demo](https://github.com/aziztitu/suffix-tree-demo) was used for
some comparisons.  That project directly implements Ukkonen's algorithm for
generalized trees.  The package concatenates all strings together separated
by a delimiter.  Build and query tests show this to be not an efficient
approach.  `suffixer` can build a tree of 370,105 dictionary words in less
than four seconds.  The delimited approach takes 10s of minutes.  When ingesting
just one very large string, `suffixer` is about a third faster than a typical
Ukkonen implementation.  Using `Map`s instead of plain objects contributes to
speed boost.  This library minimizes some function calls and eliminates full edge
representation for 1-character edges that have child nodes further improving
performance.

Run the following command to see performance tests.

```
npm run performance
```

## Caveats

Very large suffix trees may take more space than a default heap allocation.  For example,
for node.js, `--max-old-space-size` command line option may need to be used to increase
the amount of working memory.  Suffix trees in general consume a lot of space.
