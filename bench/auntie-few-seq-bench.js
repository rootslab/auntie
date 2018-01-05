/*
 * Auntie benchmark, copy pattern every k bytes.
 */

const log = console.log
    , now = Date.now
    , fs = require( 'fs' )
    , Auntie = require( '../' )
    , pattern = '-----'
    // default pattern is '\r\n'
    , untie = Auntie( pattern )
    , seq = untie.seq
    , slen = seq.length
    ;

log( '- Auntie#count benchmark, a buffer full of patterns!' );
log( '- sequence to parse is: "%s"', seq, seq );
log( '- sequence length: %d bytes', slen );

let stime = -1
    , etime = -1
    , secs = -1
    , perc = -1
    , cnt = 0
    , arr = []
    // mb 
    , mb = 60 << 20
    , q = ( mb / slen ).toFixed( 0 )
    , data = Buffer.allocUnsafe( mb ); 
    ;

log( '- filling test buffer (%d MBytes) with sequence..', mb );

for ( let i = 0; i < q; i += 256 ) seq.copy( data, i * slen );


log( '\n-> total data length: %d MBytes', mb );

log( '\n-> counting occurrences using #count..' );

stime = now();
cnt = untie.count( data )[ 0 ];
etime = now();
secs = ( etime - stime ) / 1000;
perc = ( 100 * cnt * untie.seq.length / data.length ).toFixed( 2 );


log( ' - elapsed: %d secs', secs );
log( ' - total matches: %d', cnt );
log( ' - total percentage of matching data: %d%', perc );
log( ' - %d ops/sec', ( cnt / secs ).toFixed( 2 ) );
log( ' - %d Mbits/sec', ( data.length / ( 128 * 1024 * secs ) ).toFixed( 2 ) );
log( ' - %d Gbits/sec', ( data.length / ( 128 * 1024 * 1024 * secs ) ).toFixed( 2 ) );

log( '\n- flush data and reset internal state..' );
untie.flush( true );

log( '\n-> counting occurrences using #dist..' );

stime = now();
cnt = untie.dist( data )[ 0 ];
etime = now();
secs = ( etime - stime ) / 1000;
perc = ( 100 * cnt * untie.seq.length / data.length ).toFixed( 2 );

log( ' - elapsed: %d secs', secs );
log( ' - total matches: %d', cnt );
log( ' - total percentage of matching data: %d%', perc );
log( ' - %d ops/sec', ( cnt / secs ).toFixed( 2 ) );
log( ' - %d Mbits/sec', ( data.length / ( 128 * 1024 * secs ) ).toFixed( 2 ) );
log( ' - %d Gbits/sec', ( data.length / ( 128 * 1024 * 1024 * secs ) ).toFixed( 2 ) );

log( '\n- flush data and reset internal state..' );
untie.flush( true );

log( '\n-> parsing occurrences using #do (expected 0 matches)..' );

stime = now();
cnt = untie.do( data, true );
etime = now();
secs = ( etime - stime ) / 1000;
perc = ( 100 * cnt.length * untie.seq.length / data.length ).toFixed( 2 );

log( ' - elapsed: %d secs', secs );
log( ' - total matches: %d', cnt.length );
log( ' - total percentage of matching data: %d%', perc );
log( ' - %d ops/sec', ( cnt.length / secs ).toFixed( 2 ) );
log( ' - %d Mbits/sec', ( data.length / ( 128 * 1024 * secs ) ).toFixed( 2 ) );
log( ' - %d Gbits/sec', ( data.length / ( 128 * 1024 * 1024 * secs ) ).toFixed( 2 ) );

