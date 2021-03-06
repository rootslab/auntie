/*
 * Auntie benchmark, it (SYNC) loads a file containing 8192 long english words,
 * separated by 1 byte minus '-' sequence, then we build a test buffer repeating
 * the data loaded for 512 times.
 */

const log = console.log
    , now = Date.now
    , fs = require( 'fs' )
    , Auntie = require( '../' )
    , path = __dirname + '/long-english-words-1-byte-seq.txt'
    , pattern = '-'
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
    , k = 512
    ;

fdata = Buffer.allocUnsafe( k * data.length ); 
for ( let i = 0; i < k; ++i ) data.copy( fdata, i * data.length );

// for ( let i = 0; i < 512; ++i ) arr.push( data );
// fdata = Buffer.concat( arr ); 

log( '- Auntie#count benchmark, load english long words from a file in SYNC way:\n "%s"\n', path );
log( '- sequence to parse is: "%s"', untie.seq, untie.seq );
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
log( ' - %d Gbits/sec', ( fdata.length / ( 128 * 1024 * 1024 * secs ) ).toFixed( 2 ) );

log( '\n- flush data and reset internal state..' );
untie.flush( true );

log( '\n-> counting occurrences and min/max distances using #dist..' );

stime = now();
cnt = untie.dist( fdata );
etime = now();
secs = ( etime - stime ) / 1000;
perc = ( 100 * cnt[ 0 ] * untie.seq.length / fdata.length ).toFixed( 2 );

log( ' - elapsed: %d secs', secs );
log( ' - total matches/min/max/remaining:', cnt );
log( ' - total percentage of matching data: %d%', perc );
log( ' - %d ops/sec', ( cnt / secs ).toFixed( 2 ) );
log( ' - %d Mbits/sec', ( fdata.length / ( 128 * 1024 * secs ) ).toFixed( 2 ) );
log( ' - %d Gbits/sec', ( fdata.length / ( 128 * 1024 * 1024 * secs ) ).toFixed( 2 ) );

log( '\n- flush data and reset internal state..' );
untie.flush( true );

untie.on( 'snap', () => log( arguments ))

log( '\n-> parsing occurrences using #do..' );

stime = now();
cnt = untie.do( fdata, true );
etime = now();
secs = ( etime - stime ) / 1000;
perc = ( 100 * cnt.length * untie.seq.length / fdata.length ).toFixed( 2 );

log( ' - elapsed: %d secs', secs );
log( ' - total slices: %d', cnt.length );
log( ' - total percentage of matching data: %d%', perc );
log( ' - %d ops/sec', ( cnt.length / secs ).toFixed( 2 ) );
log( ' - %d Mbits/sec', ( fdata.length / ( 128 * 1024 * secs ) ).toFixed( 2 ) );
log( ' - %d Gbits/sec', ( fdata.length / ( 128 * 1024 * 1024 * secs ) ).toFixed( 2 ) );
