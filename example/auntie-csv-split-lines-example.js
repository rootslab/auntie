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
    , bconcat = Buffer.concat
    , dpath = __dirname + '/data/little.csv'
    , pattern = '\r\n'
    // default pattern is '\r\n'
    , untie = Auntie( pattern )
    , rstream = fs.createReadStream( dpath )
    // only to output file data to console
    , csvdata = fs.readFileSync( dpath )
    ;

let t = 0
    , c = 0
    , m = 0
    , qlines = []
    , qpos = []
    , qtlen = 0
    // quote char/string for padding and quoting lines
    , quote = '"'
    // method to correctly split CSV lines
    , onData = function ( chunk ) {
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
                qresults = untie.comb( quote, el );
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
                        log( ' !(%d) quoted line -> (%d)', m, el.length, String( el ) );
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
                log(' !(%d) line -> (%d)', m, el.length, el, String( el ) );

            }
        }
    }
    , onEnd = function () {
        // emit last snip
        log( '\n -> last snip: (%d)', untie.snip.length, untie.snip, String( untie.snip ) );
        log( '\n !end stream' );
    }
    , onClose = function () {
        log( ' !close stream' );
        log();
        log( '- stream highwatermark value (chunk size): %d byte(s)', rstream._readableState.highWaterMark );
        log( '- total data chunks: %d ', c );
        log( '- total data length: %d bytes', t );
        log( '- current record separator (%d):', pattern.length, untie.seq );
        log( '- current quote char (%s):', quote, Buffer.from( quote ) );
        log( '- CSV lines matched: %d', m );
        log();
    }
    ;

// set some listeners
rstream.on( 'end', onEnd );
rstream.on( 'close', onClose );

log( '\n- Auntie example, split CSV lines:\n "%s"', dpath );

log( '\n- file data is:\n', csvdata );
log( '\nbegin>>>>\n- %s\n<<<<end', csvdata );

log( '\n- original stream highwatermark value: %d bytes', rstream._readableState.highWaterMark );

// I voluntarily reduce the chunk buffer size to k byte(s)
rstream._readableState.highWaterMark = 1;

log( '- new stream highwatermark value: %d byte(s)', rstream._readableState.highWaterMark );

log( '\n !read stream..\n' );

// parse for sequence on data event
rstream.on( 'data', onData );

