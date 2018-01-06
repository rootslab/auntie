/*
 * Auntie example for splitting lines parsing a stream of data from a CSV file.
 * Every record/line is separated by CRLF '\r\n' pattern. Every CRLF sequence
 * that appears anywhere inside quotes ("..") should be considered as part of
 * the relative quoted field, and not a valid record/line separator.
 * Note that last line should not be terminated by CRLF.
 */

const log = console.log
    , fs = require( 'fs' )
    , Auntie = require( '../' )
    , stdout = process.stdout
    , bconcat = Buffer.concat
    , dpath = __dirname + '/a.csv'
    , pattern = '\r\n'
    // default pattern is '\r\n'
    , untie = Auntie( pattern )
    , rstream = fs.createReadStream( dpath )
    // only to output file data to console
    , csvdata = fs.readFileSync( dpath )
    ;


log();
log( '- Auntie example, split CSV lines:\n "%s"', dpath );

log( '\n- file data is:\n', csvdata );
log( '\nbegin>>>>\n- %s\n<<<<end', csvdata );

log( '\n- original stream highwatermark value: %d bytes', rstream._readableState.highWaterMark );

// I voluntarily reduce the chunk buffer size to k byte(s)
rstream._readableState.highWaterMark = 1;

log( '- new stream highwatermark value: %d byte(s)', rstream._readableState.highWaterMark );

let t = 0
    , c = 0
    , m = 0
    , qlines = []
    , qpos = []
    , qtlen = 0
    , qnum = '"'.charCodeAt( 0 )
    , fn = ( data, arr ) => {
        let i = 0
            , dlen = data.length
            , results = arr || []
            ;
        for ( ; i < dlen; ++i )
            if ( qnum === data[ i ] ) results.push( i );
        return results;
    }
    ;

log( '\n !read stream..\n' );

rstream.on( 'data', function ( chunk ) {
    t += chunk.length;
    ++c;
    // log( ' -> data chunk (%d)', ++c );
    // concat current results to collected array
    let curr = untie.do( chunk, true )
        ;
    if ( curr.length ) {
        let el = curr[ 0 ]
            , i = 0
            , qresults = null
            , qrlen = 0
            , qlen = 0
            ;
        for ( ; i < curr.length; el = curr[ ++i ] ) {
            qresults = fn( el );
            qrlen = qresults.length;
            if ( qrlen ) {
                // calc right offset for single quote results
                qlen = qlines.length;
                // save/hold quoted lines
                qlines.push( el );
                if ( qlen ) {
                    let qlast = qlines[ qlen - 1 ] 
                        , qllen = qlast.length + untie.seq.length
                        , j = 0
                        ;
                    qlines[ qlen - 1 ] = bconcat( [ qlast, untie.seq ] );
                    for ( ; j < qrlen; ++j )
                        qresults[ j ] += qllen;
                }
                qtlen += qrlen;
                qpos = [ ...qpos, ...qresults ];
                // check quotes parity
                if ( ! ( qtlen & 1 ) ) {
                    ++m;
                    el = bconcat( qlines );
                    log( ' !(%d) quoted line -> (%d)', m, el.length, el );
                    log( '      quote pos:', qpos );
                    // reset quoted lines
                    qtlen = 0;
                    qlen = 0;
                    qlines = [];
                    qpos = [];
                }
                continue;
            }
            ++m;
            log(' !(%d) line -> (%d)', m, el.length, el );
        }
    }
} );

rstream.on( 'end', function () {
    log( '\n -> last snip: (%d)', untie.snip.length, untie.snip );
    log( '\n !end stream' );
} );

rstream.on( 'close', function () {
    log( ' !close stream' );
    log();
    log( '- stream highwatermark value (chunk size): %d byte(s)', rstream._readableState.highWaterMark );
    log( '- total data chunks: %d ', c );
    log( '- total data length: %d bytes', t );
    log( '- current separator (%d):', pattern.length, untie.seq );
    log( '- CSV lines matched: %d', m );
    log();
} );
