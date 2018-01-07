/*
 * Auntie example for snap event, it loads a file containing 8192
 * long english words, separated by CRLF '\r\n' pattern.
 * For "messing" things up, the chunk size is reduced to 10 bytes.
 */

const log = console.log
    , fs = require( 'fs' )
    , Auntie = require( '../' )
    , stdout = process.stdout
    , dpath = __dirname + '/data/some-english-words.txt'
    , pattern = '\r\n'
    // default pattern is '\r\n'
    , untie = Auntie( pattern )
    , rstream = fs.createReadStream( dpath )
    ;

log();
log( '- Auntie example, loading english long words from file:\n "%s"', dpath );
log( '\n- original stream highwatermark value: %d bytes', rstream._readableState.highWaterMark );

// I voluntarily reduce the chunk buffer size to 10 bytes
rstream._readableState.highWaterMark = 1;

log( '- new stream highwatermark value: %d bytes', rstream._readableState.highWaterMark );

var m = 0
    , t = 0
    , c = 0
    ;

untie.on( 'snap', function( data ) {
    log(' !snap (%d) -> (%d) %s', ++m, data.length, data );
} );

log( '\n - read stream..' );

rstream.on( 'data', function ( chunk ) {
    log( '\n -> data chunk: %d', ++c );
    t += chunk.length;
    untie.do( chunk, false );
} );

rstream.on( 'end', function () {
    log( '\n  !end' );
} );

rstream.on( 'close', function () {
    log( '  !close' );
    log();
    log( '- total data chunks: %d ', c );
    log( '- total data length: %d bytes', t );
    log( '- current pattern (%d):', pattern.length, untie.seq );
    log( '- total matches: %d', m );
    log();

} );
