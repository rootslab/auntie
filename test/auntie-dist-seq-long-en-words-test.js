/*
 * Auntie#dist test, it loads a file containing 8192
 * long english words, separated by '-----' sequence.
 * For "messing" things up, the chunk size is reduced to 1 byte.
 */

exports.test  = function ( done, assertions ) {
    const log = console.log
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        , fs = require( 'fs' )
        , sync_load_and_collect = require( './sync-load-and-collect.js' )
        , Auntie = require( '../' )
        , stdout = process.stdout
        , path = __dirname + '/long-english-words-seq.txt'
        , pattern = '-----'
        // default pattern is '\r\n'
        , untie = Auntie( pattern )
        // create an async read stream
        , rstream = fs.createReadStream( path )
        //  sync load file and collect results to test Auntie correctness
        , results = sync_load_and_collect( path, pattern )
        ;

    log( '- Auntie#count test, loading english long words from filee in ASYNC way:\n "%s"\n', path );
    log( '- current highwatermark value for stream: %d bytes', rstream._readableState.highWaterMark );
    
    // I voluntarily reduce the chunk buffer size to 1 byte
    rstream._readableState.highWaterMark = 5;

    log( '- new highwatermark value for stream: %d bytes', rstream._readableState.highWaterMark );
    log( '- starting parse data stream..' );
    log( '- counting occurrences ..' );

    let t = 0
        , c = 0
        , reply = null
        ;

    rstream.on( 'data', function ( chunk ) {
        ++c;
        t += chunk.length;
        // count returns me.cnt property, updated/incremented on every call
        reply = untie.dist( chunk );
    } );

    rstream.on( 'end', function () {
        log( '- !end stream' );
    } );

    rstream.on( 'close', function () {
        log( '- !close stream' );

        let emsg = '#count error, got: ' + untie.cnt[ 0 ] + ') (expected: ' + results.length + ')'
            , cnt = untie.cnt[ 0 ]
            ;
        assert.ok( cnt === results.length, emsg );
        
        log( '\n- total matches should be: %d', results.length );
        assert.ok( cnt === results.length );
        
        log( '\n- total matches: %d', cnt );
        log( '- total data chunks: %d ', c );
        log( '- total data length: %d bytes', t );
        exit();
    } );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();