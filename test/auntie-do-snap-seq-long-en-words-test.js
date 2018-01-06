/*
 * Auntie test for collecting results, it loads a file containing 8192
 * long english words, separated by '-----' sequence.
 * For messing things up, the chunk size is reduced to 1 byte.
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
        // sync load file and collect results to test Auntie correctness
        , results = sync_load_and_collect( path, pattern, true )[ 0 ]
        ;

    log( '- Auntie !snap event test, loading english long words from file:\n "%s"', path );
    
    let m = 0
        , t = 0
        , c = 0
        , rstream = null
        ;

    untie.on( 'snap', function ( data ) {
        let emsg = 'error, different results with match (n°:' + ( m + 1 ) + ') (expected: "' + results[ m ] + '"" is: "' + data + '")'
            ;
        assert.ok( data.compare( results[ m++ ] ) === 0, emsg );
        // avoid output on travis ci
        if ( process.env.TRAVIS ) return;
        stdout.clearLine();
        stdout.cursorTo( 0 );
        stdout.write( '  -> current data chunk (' + c + ')' );
        stdout.write(' !snap (' + ( m + 1 ) +') (' + data.length + ', ' + data + ')' );
    } );

    let run = function ( csize ) {
    
         m = 0;
         t = 0;
         c = 0;
         // create an async read stream
         rstream = fs.createReadStream( path );
         
        // voluntarily reduce the chunk buffer size to k byte
        rstream._readableState.highWaterMark = csize;

        log( '\n- new highwatermark value for stream: %d byte(s)', rstream._readableState.highWaterMark );
        log( '- starting parse data stream..' );

        rstream.on( 'data', function ( chunk ) {
            ++c;
            t += chunk.length;
            untie.do( chunk, false );
        } );

        rstream.on( 'end', function () {
            log( '\n- !end stream' );
        } );

        rstream.on( 'close', function () {
            log( '- !close stream' );
            
            let emsg = '#do error, got: ' + m + ') (expected: ' + results.length + ')'
                ;
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