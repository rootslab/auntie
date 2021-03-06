/*
 * Auntie#dist test, it loads a file containing 8192
 * long english words, separated by '-' sequence.
 * For "messing" things up, the chunk size is reduced to k byte(s).
 */

exports.test  = function ( done, assertions ) {
    const log = console.log
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        , fs = require( 'fs' )
        , sync_load_and_collect = require( './util/sync-load-and-collect.js' )
        , Auntie = require( '../' )
        , stdout = process.stdout
        , path = __dirname + '/data/long-english-words-minus.txt'
        , pattern = '-'
        // default pattern is '\r\n'
        , untie = Auntie( pattern )
        // async read stream
        , rstream = null
        //  sync load file and collect results to test Auntie correctness
        , results = sync_load_and_collect( path, pattern, true )
        , buffers = results[ 0 ]
        , distances = results[ 1 ]
        , matches = results[ 2 ]
        // length of data loaded
        , llen = results[ 3 ]
        //random numbers
        ;

    log( '- Auntie#dist test, loading english long words from file in ASYNC way:\n "%s"', path );

    log( '- calculate max, min, .. for testing correctness..' );    
    
    let i = 1
        , dlen = distances.length
        , blen = buffers.length
        , mlen = matches.length
        , rcnt = [ blen, Infinity, -Infinity, llen - matches[ mlen - 1 ] - untie.seq.length ]
        , val = distances[ 0 ]
        ;
    for ( ; i < dlen; val = distances[ ++i ] ) {
        if ( val < rcnt[ 1 ] ) rcnt[ 1 ] = val;
        else if ( val > rcnt[ 2 ] ) rcnt[ 2 ] = val;
    }
    
    log( '- values to obtain are: ', rcnt );    

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
            // change watermark to pseudo-random integer
            // rstream._readableState.highWaterMark = c;
            // avoid output on travis ci
            reply = untie.dist( chunk );
            if ( process.env.TRAVIS ) return;
            // stdout.clearLine();
            // stdout.cursorTo( 0 );
            // stdout.write( '- curr highwatermark: (' + rstream._readableState.highWaterMark + ') bytes' );
        } );

        rstream.on( 'end', function () {
            log( '\n- !end stream' );
        } );

        rstream.on( 'close', function () {
            log( '- !close stream' );

            let emsg = '#count error, got: ' + untie.cnt[ 0 ] + ') (expected: ' + buffers.length + ')'
                , cnt = reply[ 0 ]
                , min = reply[ 1 ]
                , max = reply[ 2 ]
                , rbytes = reply[ 3 ]
                ;
            assert.ok( cnt === buffers.length, emsg );
            
            log( '\n- total matches should be: %d', buffers.length );
            assert.ok( cnt === buffers.length );
            
            log( '\n- total matches: %d', cnt );
            log( '- total data chunks: %d ', c );
            log( '- total data length: %d byte(s)', t );
            log( '- average chunk size: %d byte(s)', ( t / c ).toFixed( 0 ) );

            log( '- check #dist results: ', reply );
            log( '- correct #dist results: ', rcnt );
            assert.deepEqual( rcnt, reply, 'erroneous #dist reply!' );

            // flush data
            untie.flush();

            // increment chunk size and run test until size is plen * 32
            if ( csize < untie.seq.length << 5 ) run( ++csize );
            else exit();
        } );
    };
    // start with 1 byte chunk
    run( 1 );
};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();