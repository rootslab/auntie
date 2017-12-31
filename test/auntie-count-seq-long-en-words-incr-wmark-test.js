/*
 * Auntie#count test, it loads a file containing 8192
 * long english words, separated by '-----' sequence.
 * For "messing" things up, the chunk size is reduced to k byte(s).
 */

exports.test  = function ( done, assertions ) {
    const log = console.log
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        , fs = require( 'fs' )
        , sync_load_and_collect = require( './sync-load-and-collect.js' )
        , Auntie = require( '../' )
        , stdout = process.stdout
        , path = __dirname + '/' + 'long-english-words-seq.txt'
        , pattern = '-----'
        // default pattern is '\r\n'
        , untie = Auntie( pattern )
        //  sync load file and collect results to test Auntie correctness
        , results = sync_load_and_collect( path, pattern, true )[ 0 ]
        ;

    log( '- Auntie#count test, loading english long words from file in ASYNC way:\n "%s"', path );

    var run = function ( csize ) {
    
         let t = 0
            , c = 0
            // create an async read stream
            , rstream = fs.createReadStream( path )
            ;        

        // voluntarily reduce the chunk buffer size to k byte(s)
        rstream._readableState.highWaterMark = csize;

        log( '\n- new highwatermark value for stream: %d bytes', rstream._readableState.highWaterMark );
        log( '- starting parse data stream..' );
        log( '- counting occurrences ..' );

        rstream.on( 'data', function ( chunk ) {
            ++c;
            t += chunk.length;
            rstream.pause()
            rstream._readableState.highWaterMark = c + 1;
            rstream.resume()
            // rstream._readableState.highWaterMark = c;
            // count returns me.cnt property, updated/incremented on every call
            let cnt = untie.count( chunk )[ 0 ];
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

            // flush data
            untie.flush();

            // increment chunk size and run test until size is plen * 2
            // if ( csize < untie.seq.length << 1 ) run( ++csize );
            // else exit();
        } );
    };
    // start with 1 byte chunk
    run( 1 );
};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();