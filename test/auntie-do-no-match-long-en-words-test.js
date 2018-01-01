/*
 * Auntie test for collecting results, it loads a file containing 8192
 * long english words, separated by CRLF '\r\n' pattern.
 * For messing things up, the chunk size is reduced to 10 bytes.
 */

exports.test  = function ( done, assertions ) {
    const log = console.log
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        , fs = require( 'fs' )
        , Auntie = require( '../' )
        , stdout = process.stdout
        , path = __dirname + '/data/long-english-words-crlf.txt'
        // use a not existing pattern
        , pattern = '\r\n\r\n'
        , untie = Auntie( pattern )
        // create an async read stream
        , rstream = fs.createReadStream( path )
        ;

    log( '- Auntie no match test, loading english long words from file:\n "%s"\n', path );
    log( '- current highwatermark value for stream: %d bytes', rstream._readableState.highWaterMark );
    
    // I voluntarily reduce the chunk buffer size to 1024 bytes
    rstream._readableState.highWaterMark = 1;

    log( '- new highwatermark value for stream: %d bytes', rstream._readableState.highWaterMark );
    log( '- starting parse data stream..' );

    let m = 0
        , t = 0
        , c = 0
        , csnip = null
        ;

    untie.on( 'snap', function ( data ) {
        // no snap
    } );

    untie.on( 'snip', function ( data ) {
        // get current remaining data
        csnip = data;
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
        log( '- !close stream\n' );
        // read internal snip property
        let snip = untie.snip
            // get remaining data (always snip) with flush 
            , fsnip = untie.flush( true )
            ;
        
        log( '- last snippet should be equal to the whole data' );
        assert.ok( snip.compare( fs.readFileSync( path ) ) === 0 );
        
        log( '- last snippet should be equal to the result of flush' );
        assert.ok( snip.compare( fsnip ) === 0 );
        
        log( '- last snippet should be equal to the last snip emitted' );
        assert.ok( snip.compare( csnip ) === 0 );

        log( '\n- total matches should be 0' );
        assert.ok( m === 0 );

        log( '- total matches: %d', m );
        log( '- total data chunks: %d ', c );
        log( '- total data length: %d byte(s)', t );
        log( '- average chunk size: %d byte(s)', ( t / c ).toFixed( 0 ) );
        // exit test
        exit();
    } );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();