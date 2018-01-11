### Auntie

[![NPM VERSION](http://img.shields.io/npm/v/auntie.svg?style=flat)](https://www.npmjs.org/package/auntie)
[![CODACY BADGE](https://img.shields.io/codacy/b18ed7d95b0a4707a0ff7b88b30d3def.svg?style=flat)](https://www.codacy.com/public/44gatti/auntie)
[![CODECLIMATE-TEST-COVERAGE](https://img.shields.io/codeclimate/c/rootslab/auntie.svg?style=flat)](https://codeclimate.com/github/rootslab/auntie)
[![LICENSE](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/rootslab/auntie#mit-license)

![NODE VERSION](https://img.shields.io/node/v/auntie.svg)
[![TRAVIS CI BUILD](http://img.shields.io/travis/rootslab/auntie.svg?style=flat)](http://travis-ci.org/rootslab/auntie)
[![BUILD STATUS](http://img.shields.io/david/rootslab/auntie.svg?style=flat)](https://david-dm.org/rootslab/auntie)
[![DEVDEPENDENCY STATUS](http://img.shields.io/david/dev/rootslab/auntie.svg?style=flat)](https://david-dm.org/rootslab/auntie#info=devDependencies)

[![NPM MONTHLY](http://img.shields.io/npm/dm/auntie.svg?style=flat)](http://npm-stat.com/charts.html?package=auntie)
[![NPM YEARLY](https://img.shields.io/npm/dy/auntie.svg)](http://npm-stat.com/charts.html?package=auntie)
[![NPM TOTAL](https://img.shields.io/npm/dt/auntie.svg)](http://npm-stat.com/charts.html?package=auntie)

[![NPM GRAPH](https://nodei.co/npm/auntie.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/auntie/)

> __Auntie__, _my dear_ __ultra-fast__ module for __untying/splitting/counting__
> a stream of data by a __chosen sequence/separator__.

> It uses __[Bop](https://github.com/rootslab/bop)__ under the hood, a **_Boyer-Moore_** parser,
> optimized for __separator__ lengths between 2 and 255 bytes.

### Table of Contents

- __[Install](#install)__
- __[Run Tests](#run-tests)__
- __[Run Benchmarks](#run-benchmarks)__
- __[Constructor](#constructor)__
- __[Properties](#properties)__
- __[Methods](#methods)__
    - __[count](#auntiecount)__
    - __[dist](#auntiedist)__
    - __[do](#auntiedo)__
    - __[flush](#auntieflush)__
    - __[set](#auntieset)__    
    - __[comb](#auntiecomb)__    
- __[Events](#events)__
- __[Examples](#examples)__  
  - __[split lines (streaming) from a CSV file](#split-lines-from-a-csv-file-crlf)__
  - __[count lines from a file](#count-lines-from-a-file-crlf)__ 
  - __[snap event and collect](#snap-event-and-collect-crlf)__
- __[ToDo](/ToDo.md)__
- __[MIT License](#mit-license)__

------------------------------------------------------------------------------

### Install

```bash
$ npm install auntie [-g]
```

> __require__:

```javascript
const Auntie  = require( 'auntie' );
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

> __output example and running time__:

```bash
- current path is 'test'.
- time elapsed: 187.154 secs.

  23 test files were loaded.
  23 test files were launched.
  1272381 assertions succeeded.
```
### Run Benchmarks

```bash
$ cd auntie/
$ npm run bench
```

------------------------------------------------------------------------------

### Constructor

> Arguments between [ ] are optional.

```javascript
Auntie( [ Buffer | String | Number sequence ] )
```
> or
```javascript
new Auntie( [ Buffer | String | Number sequence ] )
```
> __NOTE__: default is the `CRLF sequence \r\n`.

### Properties

> __NOTE__: do not mess up with these properties.

##### The current sequence for splitting data
```javascript
Auntie.seq : Buffer
```

##### the Boyer-Moore parser, under the hood.
```javascript
Auntie.bop : Bop
```

##### a Boyer-Moore parser, to search for generic (sub)sequences
```javascript
Auntie.gbop : Bop
```

##### the remaining data, without any match found.
```javascript
Auntie.snip : Buffer
```

##### the remaining data, used for counting.
```javascript
Auntie.csnip : Buffer
```

##### the current number of matches, min/max distance, remaining bytes.
```javascript
Auntie.cnt : Array
```

------------------------------------------------------------------------------

### Methods

|            name           |                                 description                                      |
|:--------------------------|:---------------------------------------------------------------------------------|
| __[count](#auntiecount)__ | `count (only) how many times the sequence appears in the current data.`          |
| __[dist](#auntiedist)__   | `count occurrences, min and max distance between sequences and remaining bytes.` |
| __[do](#auntiedo)__       | `split data or a stream of data by the current sequence.`                        |
| __[flush](#auntieflush)__ | `flush the remaining data, resetting internal state/counters.`                   |
| __[set](#auntieset)__     | `set a new sequence for splitting data.`                                         |
| __[comb](#auntiecomb)__   | `search a char or a sequence into the current data.`                             |

> Arguments between [ ] are optional.

#### Auntie.count
> ##### the fastest/lightest way to count how many times the sequence appears in the current data.
```javascript
/*
 * it returns an Array with the current number of occurrences.
 * 
 * NOTE: it saves the minimum necessary data that does not contains
 * the sequence, for the next #count call with fresh data (to check
 * for single occurrences between 2 chunks of data).
 */
'count' : function ( Buffer data ) : Array
```

#### Auntie.dist
> ##### count occurrences, min and max distance between sequences and remaining bytes.
```javascript
/*
 * it returns an Array with:
 * - the current number of occurrences 
 * - the minimum distance, in bytes, between any 2 sequences
 * - the maximum distance, in bytes, between any 2 sequences
 * - the remaining bytes to the end of data (without any matching sequence)
 * 
 * NOTE:
 * - also the distance from index 0 to the first match will be considered
 * - it saves the remaining data that does not contains the sequence,
 *   for the next #dist call with fresh data, to check for occurrences
 *   between chunks).
 */
'dist' : function ( Buffer data ) : Array
```

#### Auntie.do
> ##### split data or a stream of data by the current sequence
```javascript
/*
 * if collect is true, it returns an Array of results, otherwise it 
 * emits a 'snap' event for every match; then, after having finished
 * to parse data, it emits a 'snip' event, with the remaining data
 * that does not contains the sequence.
 *
 * NOTE: it saves the remaining data that does not contains the
 * sequence, for the next #do call on fresh data (to check for 
 * occurrences between chunks).
 */
'do' : function ( Buffer data [, Boolean collect ] ) : [ Array ]
```

#### Auntie.flush
> ##### flush the remaining data, resetting internal state/counters
```javascript
/*
 * if collect is true it returns a Buffer, otherwise it emits 
 * a 'snip' event with data. Obviously the snip doesn't contain
 * the sequence (no match). It is equal to get and reset the
 * internal me.snip property.
 */
'flush' : function ( [ Boolean collect ] ) : [ Buffer ]
```

> #### Auntie.set
> ##### set a new sequence for splitting data.
```javascript
// default sequence is '\r\n' or CRLF sequence.
'set' : function ( [ Buffer | String | Number sequence ] ) : Auntie
```

> #### Auntie.comb
> ##### search for a char or a sequence into the current data.
```javascript
/*
 * parse current data for a generic sequence. It returns an Array of indexes.
 * NOTE: it doesn't affect the current streaming parser and it doesn't save
 * any data. It simply parses a chunk of data for the specified sequence,
 * optionally from a starting index and limiting results to a specified number
 * of occurrences (like Bop.parse does).
 */
'comb' : function ( Buffer | String seq, Buffer data [, Number from [, Number limit ] ] ) : Array
```

------------------------------------------------------------------------------

### Events

> Auntie emits only __2__ types of events: __`snap`__ and __`snip`__.

##### !snap a result.
```javascript
'snap' : function ( Buffer result )
```

##### !snip current remaining data (with no match found).
```javascript
'snip' : function ( Buffer result )
```

> __NOTE__: if the '_collect_' switch for the __do__/__flush__ was set (true),
> then no event will be emitted.

------------------------------------------------------------------------------

### Examples

#### split lines from a CSV file (CRLF):

> - __[do, comb: streaming data](example/auntie-csv-split-lines-example.js)__

#### count lines from a file (CRLF):
 
 > - __[count: sync load](example/auntie-count-sync-load-example.js)__
 > - __[dist: sync load](example/auntie-dist-sync-load-example.js)__
 > - __[count: streaming data](example/auntie-count-async-stream-example.js)__
 > - __[dist: streaming data](example/auntie-dist-async-stream-example.js)__
 
#### snap event and collect (CRLF):

 > - __[do snap: streaming data](example/auntie-do-snap-event-example.js)__
 > - __[do collect: streaming data](example/auntie-do-collect-results-example.js)__

> See __[ All examples](example/)__.

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
