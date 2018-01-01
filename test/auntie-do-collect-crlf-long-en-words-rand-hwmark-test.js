/*
 * Auntie test for collecting results, it loads a file containing 8192
 * long english words, separated by CRLF '\r\n' pattern.
 * For "messing" things up, the chunk size is randomly generated.
 */

exports.test  = function ( done, assertions ) {
    const log = console.log
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        , fs = require( 'fs' )
        , sync_load_and_collect = require( './util/sync-load-and-collect.js' )
        , Auntie = require( '../' )
        , stdout = process.stdout
        , path = __dirname + '/data/long-english-words-crlf.txt'
        , pattern = '\r\n'
        // default pattern is '\r\n'
        , untie = Auntie( pattern )
        // async read stream
        , rstream = null
        //  sync load file and collect results to test Auntie correctness
        , results = sync_load_and_collect( path, pattern, true )[ 0 ]
        //random numbers
        , rand = ( min, max ) => {
            min = + min || 0;
            max = + max || 4000;
            return min + Math.floor( Math.random() * ( max - min + 1 ) );
        }
        ;

    log( '- Auntie collecting test, loading english long words from file:\n "%s"', path );
    
    var run = function ( csize ) {
    
        let t = 0
            , c = 0
             // create an async read stream
            , rstream = fs.createReadStream( path )
            , collected = []
            ;

        // voluntarily reduce the chunk buffer size to k byte(s)
        rstream._readableState.highWaterMark = csize;

        log( '\n- new highwatermark value for stream: %d bytes', rstream._readableState.highWaterMark );
        log( '- starting parse data stream..' );
     
        rstream.on( 'data', function ( chunk ) {
            ++c;
            t += chunk.length;
            rstream._readableState.highWaterMark = rand( 1, c << 1 );
            stdout.clearLine();
            stdout.cursorTo( 0 );
            stdout.write( '- curr highwatermark: (' + rstream._readableState.highWaterMark + ') bytes' );
            // concat current results to collected array
            let curr = untie.do( chunk, true );
            // concat, test results later, on 'close' event
            if ( curr.length ) collected = collected.concat( curr );
        } );

        rstream.on( 'end', function () {
            log( '\n- !end stream' );
        } );

        rstream.on( 'close', function () {
            log( '- !close stream' );

            let emsg = null
                , el = collected[ 0 ]
                , m = 0
                ;
            for ( ; m < collected.length; el = collected[ ++m ] ) {
                emsg = 'error, different results with match (n°:' + m + ') (expected: ' + results[ m ] + ' is: ' + el + ')';
                stdout.clearLine();
                stdout.cursorTo( 0 );
                stdout.write('  -> check collected results (' + ( m + 1 ) + ') , current is: (' + el.length + ', ' + el + ')' );
                // check if results (buffers) are equal
                assert.ok( el.compare( results[ m ] ) === 0, emsg );
            }

            log( '\n- total matches should be: %d', results.length );
            assert.ok( m === results.length );

            log( '\n- total matches: %d', m );
            log( '- total data chunks: %d ', c );
            log( '- total data length: %d byte(s)', t );
            log( '- average chunk size: %d byte(s)', ( t / c ).toFixed( 0 ) );

            // flush data
            untie.flush();

            // increment chunk size and run test until size is plen * 2
            if ( csize < untie.seq.length << 1 ) run( ++csize );
            else exit();
        } );
    };
    // start with 1 byte chunk
    run( 1 );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();