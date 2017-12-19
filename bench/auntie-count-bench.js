/*
 * Auntie example, it (SYNC) loads a file containing 8192 long english words,
 * separated by CRLF '\r\n' sequence, then we build a test buffer repeating
 * the data loaded for 512 times.
 */

const log = console.log
    , now = Date.now
    , fs = require( 'fs' )
    , Auntie = require( '../' )
    , path = __dirname + '/long-english-words.txt'
    , pattern = '\r\n'
    // default pattern is '\r\n'
    , untie = Auntie( pattern )
    ;

let data = fs.readFileSync( path )
    , stime = -1
    , etime = -1
    , secs = -1
    , perc = -1
    , cnt = 0
    , arr = []
    ;
for ( let i = 0; i < 512; ++i ) arr.push( data );
fdata = Buffer.concat( arr ); 


log( '- Auntie#count benchmark, load english long words from a file in SYNC way:\n "%s"\n', path );
log( '- sequence to parse is "\\r\\n" ->', untie.seq );
log( '- sequence length: %d bytes', untie.seq.length );
log( '\n-> total data length: %d MBytes', fdata.length >>> 20 );

log( '\n-> counting occurrences using #count..' );

stime = now();
cnt = untie.count( fdata )[ 0 ];
etime = now();
secs = ( etime - stime ) / 1000;
perc = ( 100 * cnt * untie.seq.length / fdata.length ).toFixed( 2 );

log( ' - elapsed: %d secs', secs );
log( ' - total matches: %d', cnt );
log( ' - total percentage of matching data: %d%', perc );
log( ' - %d ops/sec', ( cnt / secs ).toFixed( 2 ) );
log( ' - %d Mbits/sec', ( fdata.length / ( 128 * 1024 * secs ) ).toFixed( 2 ) );

log( '\n- flush data and reset internal state..' );
untie.flush( true );

log( '\n-> parsing occurrences using #do..' );

stime = now();
cnt = untie.do( fdata, true );
etime = now();
secs = ( etime - stime ) / 1000;
perc = ( 100 * cnt.length * untie.seq.length / fdata.length ).toFixed( 2 );

log( ' - elapsed: %d secs', secs );
log( ' - total matches: %d', cnt.length );
log( ' - total percentage of matching data: %d%', perc );
log( ' - %d ops/sec', ( cnt.length / secs ).toFixed( 2 ) );
log( ' - %d Mbits/sec', ( fdata.length / ( 128 * 1024 * secs ) ).toFixed( 2 ) );
