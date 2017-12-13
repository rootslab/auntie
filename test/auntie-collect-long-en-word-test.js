/*
 * Auntie test for collecting results, it loads a file containing 8192
 * long english words, separated by CRLF '\r\n' pattern.
 * For "messing" things up, the chunk size is reduced to 10 bytes.
 */

exports.test  = function ( done, assertions ) {
    const log = console.log
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        , fs = require( 'fs' )
        , sync_load_and_collect = require( './sync-load-and-collect.js' )
        , Auntie = require( '../' )
        , stdout = process.stdout
        , path = __dirname + '/long-english-words.txt'
        , pattern = '\r\n'
        // default pattern is '\r\n'
        , untie = Auntie( pattern )
        // create an async read stream
        , rstream = fs.createReadStream( path )
        //  sync load file and collect results to test Auntie correctness
        , results = sync_load_and_collect( path, pattern )
        ;

    log( '- Auntie collecting test, loading english long words from file:\n "%s"\n', path );
    log( '- original stream highwatermark value: %d bytes', rstream._readableState.highWaterMark );
    
    // I voluntarily reduce the chunk buffer size to 10 bytes
    rstream._readableState.highWaterMark = 10;

    log( '- new stream highwatermark value: %d bytes', rstream._readableState.highWaterMark );
    log( '- starting parse data stream..' );

    let t = 0
        , c = 0
        , collected = []
        ;

    rstream.on( 'data', function ( chunk ) {
        ++c;
        t += chunk.length;
        // concat current results to collected array
        let curr = untie.do( chunk, true );
        // concat, test results later, on 'close' event
        if ( curr.length ) collected = collected.concat( curr );
    } );

    rstream.on( 'end', function () {
        log( '- !end stream' );
    } );

    rstream.on( 'close', function () {
        log( '- !close stream' );

        let emsg = null
            , el = collected[ 0 ]
            , i = 0
            ;
        for ( ; i < collected.length; el = collected[ ++i ] ) {
            emsg = 'error, different results with match (n°:' + i + ') (expected:' + results[ i ] + ' is: ' + el + ')';
            stdout.clearLine();
            stdout.cursorTo( 0 );
            stdout.write('  -> check collected results (' + ( i + 1 ) + ') , current is: (' + el.length + ', ' + el + ')' );
            // check if results (buffers) are equal
            assert.ok( el.compare( results[ i ] ) === 0, emsg );
        }

        log( '\n- total matches should be %d', i );
        assert.ok( i === results.length );

        log( '\n- total matches: %d', i );
        log( '- total data chunks: %d ', c );
        log( '- total data length: %d bytes', t );
        exit();
    } );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();