/*
 * Auntie#count example, it (SYNC) loads a file containing 8192 long english words,
 * separated by CRLF '\r\n' sequence.
 */

const log = console.log
    , fs = require( 'fs' )
    , Auntie = require( '../' )
    , path = __dirname + '/data/long-english-words-crlf.txt'
    , pattern = '\r\n'
    // default pattern is '\r\n'
    , untie = Auntie( pattern )
    // create a sync read stream
    , fdata = fs.readFileSync( path )
    ;

log( '\n- Auntie#count example, load english long words from a file in SYNC way:\n "%s"\n', path );
log( '- sequence to parse is "\\r\\n" ->', untie.seq );
log( '- starting parse data stream ..' );
log( '- counting occurrences ..' );

let cnt = untie.count( fdata )[ 0 ];

log( '\n- total data length: %d bytes', fdata.length );
log( '\n- total matches: %d (lines)\n', cnt );
