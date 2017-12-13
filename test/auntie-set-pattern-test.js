/*
 * Auntie#set pattern test
 */

exports.test  = function ( done, assertions ) {
    const log = console.log
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        , Auntie = require( '../' )
        // use a not existing pattern
        , CRLF = Buffer.from( '\r\n' )
        , CRLFCRLF = Buffer.from( '\r\n\r\n' )
        , untie = Auntie()
        // create an async read stream
        , anumber = Math.random() * 1977
        ;

    log( '- Auntie#set a random number (%d) as pattern.', anumber );
    untie.set( anumber );
    
    log( '- check pattern correctness..' );
    assert.ok( untie.pattern, Buffer.from( String( anumber ) ) );
    
    log( '- remaining data (snip) should be empty, after calling #set' );
    assert.ok( untie.snip.length === 0 );

    untie.set( CRLFCRLF );

    log( '- Auntie#set pattern test, current pattern is:', CRLFCRLF );
    assert.ok( untie.pattern.compare( CRLFCRLF ) === 0, 'error in Auntie constructor, pattern should be "\\r\\n\\r\\n"' );

    log( '- Auntie#set change pattern with no arguments (CRLF)' );
    untie.set();

    log( '- pattern should be "\\r\\n" (CRLF):', untie.pattern );
    assert.ok( untie.pattern.compare( CRLF ) === 0, 'error in Auntie#set, pattern should be "\\r\\n"' );

    assert.ok( untie.pattern.compare( CRLF ) === 0, 'error in Auntie#set, pattern should be "\\r\\n"' );

    log( '- collect results..' );

    let tdata = Buffer.concat( [ CRLFCRLF, CRLF, CRLFCRLF ] )
        , results = untie.do( tdata, true )
        ;
    log( '- Auntie#do with weird data (CRLFCRLFCRLF):', tdata );
    log( '- results should be empty:', results );
    assert.ok( results.length === 0 );

    log( '- Auntie#set change pattern to (CRLFCRLF)' );
    untie.set( CRLFCRLF );

    log( '- collect results with weird data..', tdata );
    results = untie.do( tdata, true );
    
    log( '- results should be empty', results );
    assert.ok( results.length === 0 );

    log( '- check remaining data, should be "\\r\\n" (CRLF)', untie.snip );
    assert.ok ( untie.snip.compare( CRLF ) === 0 );

    log( '- flush data in async way emitting "snip" event with remaining data' );
    untie.on( 'snip', function ( data ) {
        log( '  !snip' );
        log( '  -> snip data should be "\\r\\n" (CRLF)', data );
        assert.ok( CRLF.compare( data ) === 0 );
        exit();
    } );

    untie.flush( false );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();