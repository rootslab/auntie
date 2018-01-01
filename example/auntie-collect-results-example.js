/*
 * Auntie example for collecting results, it loads a file containing 8192
 * long english words, separated by CRLF '\r\n' pattern.
 */

const log = console.log
    , fs = require( 'fs' )
    , Auntie = require( '../' )
    , stdout = process.stdout
    , dpath = __dirname + '/long-english-words.txt'
    , pattern = '\r\n'
    // default pattern is '\r\n'
    , untie = Auntie( pattern )
    , rstream = fs.createReadStream( dpath )
    ;

log();
log( '- Auntie example, loading english long words from file:\n "%s"', dpath );
log( '\n- original stream highwatermark value: %d bytes', rstream._readableState.highWaterMark );

// I voluntarily reduce the chunk buffer size to k bytes
rstream._readableState.highWaterMark = 1;

log( '- new stream highwatermark value: %d byte(s)', rstream._readableState.highWaterMark );

let t = 0
    , c = 0
    , m = 0
    ;

log( '\n - read stream..' );

rstream.on( 'data', function ( chunk ) {
    log( ' -> data chunk (%d)', ++c );
    t += chunk.length;
    // concat current results to collected array
    let curr = untie.do( chunk, true )
        ;
    if ( curr.length ) {
        let el = curr[ 0 ]
            , i = 0
            ;
        for ( ; i < curr.length; el = curr[ ++i ] ) {
            ++m;
            log(' !snap (%d) -> (%d) %s', m, el.length, el );
        }
    }
} );

rstream.on( 'end', function () {
    log( '\n !end' );
} );

rstream.on( 'close', function () {
    log( ' !close' );
    log();
    log( '- stream highwatermark value (chunk size): %d byte(s)', rstream._readableState.highWaterMark );
    log( '- total data chunks: %d ', c );
    log( '- total data length: %d bytes', t );
    log( '- current pattern (%d):', pattern.length, untie.seq );
    log( '- total matches: %d', m );
    log();

} );
