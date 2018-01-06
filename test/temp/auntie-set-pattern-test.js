/*
 * Auntie#set sequence test
 */

exports.test  = function ( done, assertions ) {
    const log = console.log
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        , Auntie = require( '../' )
        // use a not existing sequence
        , CRLF = Buffer.from( '\r\n' )
        , CRLFCRLF = Buffer.from( '\r\n\r\n' )
        , untie = Auntie()
        // create an async read stream
        , anumber = Math.random() * 1977
        ;

    log( '- Auntie#set a random number (%d) as sequence.', anumber );
    untie.set( anumber );
    
    log( '- check sequence correctness..' );
    assert.ok( untie.seq, Buffer.from( String( anumber ) ) );
    
    log( '- remaining data (snip) should be empty, after calling #set' );
    assert.ok( untie.snip.length === 0 );

    untie.set( CRLFCRLF );

    log( '- Auntie#set sequence test, current sequence is:', CRLFCRLF );
    assert.ok( untie.seq.compare( CRLFCRLF ) === 0, 'error in Auntie constructor, sequence should be "\\r\\n\\r\\n"' );

    log( '- Auntie#set change sequence with no arguments (CRLF)' );
    untie.set();

    log( '- sequence should be "\\r\\n" (CRLF):', untie.seq );
    assert.ok( untie.seq.compare( CRLF ) === 0, 'error in Auntie#set, seq should be "\\r\\n"' );

    assert.ok( untie.seq.compare( CRLF ) === 0, 'error in Auntie#set, sequence should be "\\r\\n"' );

    log( '- collect results..' );

    let tdata = Buffer.concat( [ CRLFCRLF, CRLF, CRLFCRLF ] )
        , results = untie.do( tdata, true )
        ;
    log( '- Auntie#do with weird data (CRLFCRLFCRLF):', tdata );
    log( '- results should be empty:', results );
    assert.ok( results.length === 0 );

    log( '- Auntie#set change sequence to (CRLFCRLF)' );
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