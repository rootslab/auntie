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
        , sync_load_and_collect = require( './util/sync-load-and-collect.js' )
        , Auntie = require( '../' )
        , stdout = process.stdout
        , path = __dirname + '/data/long-english-words-seq.txt'
        , pattern = '-----'
        // default pattern is '\r\n'
        , untie = Auntie( pattern )
        //  sync load file and collect results to test Auntie correctness
        , results = sync_load_and_collect( path, pattern, true )[ 0 ]
        //random numbers
        , rand = ( min, max ) => {
            min = + min || 0;
            max = + max || 4000;
            return min + Math.floor( Math.random() * ( max - min + 1 ) );
        }
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

        log( '\n- starting parse data stream..' );
        log( '- counting occurrences ..' );
        log( '- starting value for stream highwatermark: %d bytes', rstream._readableState.highWaterMark );

        rstream.on( 'data', function ( chunk ) {
            ++c;
            t += chunk.length;
            // change watermark to pseudo-random integer
            rstream._readableState.highWaterMark = rand( 1, 256 );
            stdout.clearLine();
            stdout.cursorTo( 0 );
            stdout.write( '- curr highwatermark: (' + rstream._readableState.highWaterMark + ') bytes' );
            // count returns me.cnt property, updated/incremented on every call
            let cnt = untie.count( chunk )[ 0 ];
        } );

        rstream.on( 'end', function () {
            log( '\n- !end stream' );
        } );

        rstream.on( 'close', function () {
            log( '- !close stream' );

            let emsg = '\n#count error, got: ' + untie.cnt[ 0 ] + ') (expected: ' + results.length + ')'
                , cnt = untie.cnt[ 0 ]
                ;
            assert.ok( cnt === results.length, emsg );
            
            log( '\n- total matches should be: %d', results.length );
            assert.ok( cnt === results.length );
            
            log( '\n- total matches: %d', cnt );
            log( '- total data chunks: %d ', c );
            log( '- total data length: %d byte(s)', t );
            log( '- average chunk size: %d byte(s)', ( t / c ).toFixed( 0 ) );

            // flush data
            untie.flush();

            // increment chunk size and run test until size is plen * 16
            if ( csize < untie.seq.length << 4 ) run( ++csize );
            else exit();
        } );
    };
    // start with 1 byte chunk
    run( 1 );
};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();