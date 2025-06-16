# `suffixer`

## Algorithm Description

### Introduction

Ukkonen's suffix tree construction algorithm, in its [academic format](./ukkonen-1995-on-line-construction-of-suffix-trees.pdf),
is unlikely to be readily accessible for most readers.  The terminology employed plus the
terseness of the language make it challenging to understand and implement an otherwise
interesting approach.  Probably the most helpful resources are videos that take one
step by step through a suffix tree construction: [example 1](https://www.youtube.com/watch?v=yg8Rkv8WLSg)
and [example 2](https://www.youtube.com/watch?v=aPRqocoBsFQ).  Many such instructionals
adopt the original terminology (e.g., active point) and are predominantly single-string
focused.  The distinct purpose of this write-up is to provide a step-by-step outline of
generalized (i.e., multi-string) suffix tree construction.  The differentiating and
hopefully a helpful feature of this explanation is its highlighting of the changes in an
underlying data structure rather than a visualization of the expanding suffix tree.

### Prerequisites


