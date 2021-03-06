/*
 * Auntie example for #do, parsing for a single minus '-' char sequence
 */

const log = console.log
    , fs = require( 'fs' )
    , Auntie = require( '../' )
    , dpath = __dirname + '/data/long-english-words-1-byte-seq.txt'
    , pattern = '-'
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

let m = 0
    , t = 0
    , c = 0
    ;

untie.on( 'snap', function( data ) {
    log(' !snap (%d) -> (%d) %s', ++m, data.length, data );
} );

log( '\n - read stream..' );

rstream.on( 'data', function ( chunk ) {
    ++c;
    // log( ' -> data chunk: %d', c );
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
