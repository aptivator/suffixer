export function endsWith(strings, searchString) {
  let results = new Map();
  let {length: searchStringLength} = searchString;

  for(let i = 0, {length} = strings; i < length; i++) {
    let string = strings[i];
    let position = string.indexOf(searchString);

    if(position > - 1) {
      if(position + searchStringLength === string.length) {
        results.set(string, position);
      }
    }
  }

  return results;
}

export function excludes(strings, searchString) {
  let results = new Set();

  for(let i = 0, {length} = strings; i < length; i++) {
    let string = strings[i];

    if(!string.includes(searchString)) {
      results.add(string);
    }
  }

  return results;
}

export function includes(strings, searchString) {
  let results = new Map();

  for(let i = 0, {length} = strings; i < length; i++) {
    let string = strings[i];
    let position = string.indexOf(searchString);

    if(position > -1) {
      let indices = new Set([position]);
      results.set(string, indices);

      while((position = string.indexOf(searchString, position + 1)) > -1) {
        indices.add(position);
      }
    }
  }

  return results;
}

export function startsWith(strings, searchString) {
  let results = new Set();

  for(let i = 0, {length} = strings; i < length; i++) {
    let string = strings[i];

    if(string.startsWith(searchString)) {
      results.add(string);
    }
  }

  return results;
}
