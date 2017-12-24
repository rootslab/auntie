/*
 * Auntie test for collecting results, it loads a file containing 8192
 * long english words, separated by CRLF '\r\n' pattern.
 * For messing things up, the chunk size is reduced to 1 byte.
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

    log( '- Auntie !snap event test, loading english long words from file:\n "%s"\n', path );
    log( '- current highwatermark value for stream: %d byte(s)', rstream._readableState.highWaterMark );
    
    // voluntarily reduce the chunk buffer size to k byte
    rstream._readableState.highWaterMark = 1;

    log( '- new highwatermark value for stream: %d byte(s)', rstream._readableState.highWaterMark );
    log( '- starting parse data stream..' );

    let m = 0
        , t = 0
        , c = 0
        ;

    untie.on( 'snap', function ( data ) {
        let emsg = 'error, different results with match (n°:' + ( m + 1 ) + ') (expected: "' + results[ m ] + '"" is: "' + data + '")'
            ;
        stdout.clearLine();
        stdout.cursorTo( 0 );
        stdout.write( '  -> current data chunk (' + c + ')' );
        stdout.write(' !snap (' + ( m + 1 ) +') (' + data.length + ', ' + data + ')' );
        // check if results (buffers) are equal
        assert.ok( data.compare( results[ m++ ] ) === 0, emsg );
    } );

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
        
        log( '\n- total matches should be: %d', results.length );
        assert.ok( m === results.length );
        
        log( '\n- total matches: %d', m );
        log( '- total data chunks: %d ', c );
        log( '- total data length: %d bytes', t );
        exit();
    } );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();