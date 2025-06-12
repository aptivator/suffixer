import {getBabelOutputPlugin}   from '@rollup/plugin-babel';
import pick                     from 'lodash.pick';
import path                     from 'path';
import {packageJsonBaseFields}  from './_lib/vars';
import {writePackageJsonPlugin} from './rollup-plugin-write-package-json/rollup-plugin-write-package-json.js';

let packageJson = require('../package.json');
let {name} = packageJson;
let input = `src/${name}.js`;
let main = `${name}.js`;
let module = `${name}.esm.js`;
let distDir = path.resolve(__dirname, '../dist');
let distES5Dir = path.resolve(distDir, 'es5');
let exports = {
  '.': {
    require: `./${main}`, 
    import: `./${module}`
  },
  './es5': {
    require: `./es5/${main}`,
    import: `./es5/${module}`
  }
};

let ES5BabelPlugins = [['esm', false], ['umd', 'umd']].reduce((plugins, [name, modules]) => {
  return Object.assign(plugins, {
    [name]: getBabelOutputPlugin({
      presets: [[
        '@babel/preset-env', {
          corejs: '3.40.0',
          useBuiltIns: 'usage',
          modules
        }
      ]]
    })
  });
}, {});

packageJson = pick(packageJson, packageJsonBaseFields);
Object.assign(packageJson, {exports});

export default [{
  input,
  output: [{
    format: 'esm',
    file: path.resolve(distDir, module),
    name
  }, {
    format: 'umd',
    file: path.resolve(distDir, main),
    name
  }],
  plugins: [
    writePackageJsonPlugin(packageJson, path.resolve(distDir, 'package.json'))
  ]
}, {
  input,
  output: [{
    format: 'esm',
    file: path.resolve(distES5Dir, module),
    name,
    plugins: [ES5BabelPlugins.esm]
  }, {
    format: 'esm',
    file: path.resolve(distES5Dir, main),
    name,
    plugins: [ES5BabelPlugins.umd]
  }]
}];
