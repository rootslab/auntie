### Auntie

[![NPM VERSION](http://img.shields.io/npm/v/auntie.svg?style=flat)](https://www.npmjs.org/package/auntie)
[![CODACY BADGE](https://img.shields.io/codacy/b18ed7d95b0a4707a0ff7b88b30d3def.svg?style=flat)](https://www.codacy.com/public/44gatti/auntie)
[![CODECLIMATE-TEST-COVERAGE](https://img.shields.io/codeclimate/coverage/github/rootslab/auntie.svg?style=flat)](https://codeclimate.com/github/rootslab/auntie)
[![LICENSE](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/rootslab/auntie#mit-license)

![NODE VERSION](https://img.shields.io/node/v/auntie.svg)
[![TRAVIS CI BUILD](http://img.shields.io/travis/rootslab/auntie.svg?style=flat)](http://travis-ci.org/rootslab/auntie)
[![BUILD STATUS](http://img.shields.io/david/rootslab/auntie.svg?style=flat)](https://david-dm.org/rootslab/auntie)
[![DEVDEPENDENCY STATUS](http://img.shields.io/david/dev/rootslab/auntie.svg?style=flat)](https://david-dm.org/rootslab/auntie#info=devDependencies)

[![NPM MONTHLY](http://img.shields.io/npm/dm/auntie.svg?style=flat)](http://npm-stat.com/charts.html?package=auntie)
![NPM YEARLY](https://img.shields.io/npm/dy/auntie.svg)

[![NPM GRAPH](https://nodei.co/npm/auntie.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/auntie/)

> __Auntie__, _my dear_ __ultra-fast__ module for __untying/splitting__ a stream of data with a __choosen pattern__.

> It uses __[Bop](https://github.com/rootslab/bop)__ under the hood, a **_Boyer-Moore_** parser,
> optimized for pattern lengths <= 255 bytes.


### Install

```bash
$ npm install auntie [-g]
```

> __require__:

```javascript
var Auntie  = require( 'auntie' );
```
### Run Tests

> __to run all test files, install devDependencies:__

```bash
 $ cd auntie/
 # install or update devDependencies
 $ npm install 
 # run tests
 $ npm test
```

> __to execute a single test file simply do__:

```bash
 $ node test/file-name.js
```


### Constructor

> Arguments between [] are optional.

> __NOTE__: the default pattern is **_'\r\n'_** (CRLF sequence).

```javascript
Auntie( [ Buffer pattern | String pattern | Number pattern ] )
// or
new Auntie( [ Buffer pattern | String pattern | Number pattern ] )
```

###  Properties

```javascript
// The current pattern for splitting data
Auntie.pattern : Buffer

// the Boyer-Moore parser, under the hood.
Auntie.bop : Bop

// the remaining data, without any match found.
Auntie.snip = Buffer

```

### Methods

> Arguments between [] are optional.

```javascript
/*
 * split a stream of data with the current pattern, if collect is true,
 * it returns an Array of results, otherwise it emits a 'snap' event for
 * every match; then, after having finished to parse data, it emits a 'snip'
 * event, with the remaining data that does not contains the pattern.
 */

'do' : function ( Buffer data [, Boolean collect ] ) : [ Array results ]

/*
 * flush the remaining data, if collect is true it returns
 * a Buffer, otherwise it emits a 'snip' event with data.
 * Obviously the snip doesn't contain the pattern (no match).
 */
'flush' : function ( [ Boolean collect ] ) : [ Buffer snip ]

/*
 * set a new pattern for splitting data, the default pattern
 * is '\r\n' or CRLF sequence.
 */
'set' : function ( [ Buffer pattern | String pattern | Number pattern ] ) : Auntie

```


#### Events

> Auntie emits only __2__ types of events: __snap__ and __snip__.

> __NOTE__: if the 'collect' switch for the 'do' and 'flush'
> is set to true, no event will be emitted.

```javascript
// a result has been found.
'snap' : function ( Buffer result )

// the current remaining data, without any match found.
'snip' : function ( Buffer result )
```

#### Examples

> See __[examples](example/)__.

### MIT License

> Copyright (c) 2017-present &lt; Guglielmo Ferri : 44gatti@gmail.com &gt;

> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> 'Software'), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:

> __The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.__

> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
> CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
> TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
> SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
