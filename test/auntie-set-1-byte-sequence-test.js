/*
 * Auntie#set new 1 byte sequence test
 */

exports.test  = function ( done, assertions ) {
    const log = console.log
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        , Auntie = require( '../' )
        // use a not existing sequence
        , minus = Buffer.from( '-' )
        // defult is \r\n
        , untie = Auntie()
        , complex = {
            do : untie.do
            , count : untie.count
            , dist : untie.dist
        }
        , utf8char = Buffer.from( 'é' )
        ;


    log( '- Auntie#set set %d byte(s) sequence (%s) as sequence.', minus.length, minus );
    untie.set( minus );
    
    log( '- check if method #do switch to naive mode..' );
    assert.ok( untie.do !== complex.do );
    
    log( '- check if method #count switch to naive mode..' );
    assert.ok( untie.do !== complex.do );

    log( '- check if method #dist switch to naive mode..' );
    assert.ok( untie.dist !== complex.dist );
    
    log( '- Auntie#set change sequence with no arguments (CRLF)' );
    untie.set();

    log( '- check if method #do switch to complex mode..' );
    assert.ok( untie.do === complex.do );
    
    log( '- check if method #count switch to complex mode..' );
    assert.ok( untie.do === complex.do );

    log( '- set %d bytes (UTF-8) char as sequence: "%s" -> ', utf8char.length, utf8char, utf8char );
    untie.set( utf8char );

    log( '- check #do method, it should not have been switched to naive mode (obviously)' );
    assert.ok( untie.do === complex.do );

    log( '- check #count method, it should not have been switched to naive mode (obviously)' );
    assert.ok( untie.count === complex.count );

    log( '- check #dist method, it should not have been switched to naive mode (obviously)' );
    assert.ok( untie.dist === complex.dist );

    // exit test
    exit();
};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();