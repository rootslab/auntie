/*
 * Auntie#dist example it (ASYNC) loads a file containing 8192 long english words,
 * separated by CRLF '\r\n' sequence
 * For "messing" things up, you could reduce the chunk size to 4 bytes.
 */

const log = console.log
    , fs = require( 'fs' )
    , Auntie = require( '../' )
    , path = __dirname + '/some-english-words.txt'
    , pattern = '\r\n->'
    // default pattern is '\r\n'
    , untie = Auntie( pattern )
    // create an async read stream
    , rstream = fs.createReadStream( path )
    ;

log( '\n- Auntie#count example, load english long words from a file in ASYNC way:\n "%s"\n', path );

// uncomment lines below to reduce the stream chunk size to 4 bytes
// log( '- current highwatermark value for stream: %d bytes', rstream._readableState.highWaterMark );
// I voluntarily reduce the chunk buffer size to 4 bytes
rstream._readableState.highWaterMark = 1;
// log( '- new highwatermark value for stream: %d bytes', rstream._readableState.highWaterMark );

log( '- sequence to parse is "\\r\\n" ->', untie.seq );
log( '- starting parse data stream..' );
log( '- counting occurrences in the data stream..' );

let chunks = 0
    , tot = 0
    , result = null
    ;

rstream.on( 'data', function ( chunk ) {
    ++chunks;
    tot += chunk.length;
    log()
    log( 'c:', chunk )
    result = untie.dist( chunk );
    log( 'r:', result )
    log()
} );

rstream.on( 'end', function () {
    log( '- !end stream' );
} );

rstream.on( 'close', function () {
    log( '- !close stream' );
    log( '\n- total data length: %d bytes', fdata.length );
    log( '- total matches: %d (lines)', result[ 0 ] );
    log( '\n- min length: %d bytes', result[ 1 ] );
    log( '- max length: %d bytes', result[ 2 ] );
    log( '- remaining : %d bytes\n', result[ 3 ] );
} );