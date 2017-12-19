/*
 * Auntie, my dear ultra-fast module for untying/splitting/counting  
 * a stream of data by a chosen sequence/separator.
 *
 * Copyright(c) 2017-present Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.Auntie = ( function () {

    const log = console.log
        , emitter = require( 'events' ).EventEmitter
        , util = require( 'util' )
        , Bolgia = require( 'bolgia' )
        , Bop = require( 'bop' )
        , ooo = Bolgia.circles
        , doString = Bolgia.doString
        , bconcat = Buffer.concat
        , apush = Array.prototype.push
        // default sequence
        , crlf =  Buffer.from( '\r\n' )
        // check input type
        , check = ( sequence ) => {
            switch ( doString( sequence ) ) {
                case ooo.num:
                    sequence = String( sequence );
                case ooo.str:
                    sequence = Buffer.from( sequence );
                case ooo.buf:
                 if ( sequence.length ) break;
                default:
                   sequence = crlf;
                break;
            };
            return sequence;
        }
        , Auntie = function ( sequence ) {
            const me = this
                , is = me instanceof Auntie
                ;
            if ( ! is ) return new Auntie( sequence );
            me.seq = check( sequence );
            me.bop = Bop( me.seq );
            me.snip = Buffer.alloc( 0 );
            // for counter
            me.csnip = Buffer.alloc( 0 );
            me.cnt = 0;
        }
        ;

    util.inherits( Auntie, emitter );

    const aproto = Auntie.prototype;
    
    aproto.do = function ( data, collect ) {
        const me = this
            , bop = me.bop
            , plen = me.seq.length
            , olen = me.snip.length
            , results = collect ? [] : null
            , offset = []
            ;
        if ( olen ) {
            // a snip of previous data exists
            // check if sequence is longer than remaining data
            if ( data.length < plen ) data = bconcat( [ me.snip, data ] );
            else {
                // temporarily slice only necessary (sequence-length) bytes
                // TODO: inefficient when the previous snip was very large
                // RESP: parse from the end of snip - sequence.length
                let snip = bconcat( [ me.snip, data.slice( 0, plen ) ] )
                    // only 1 match is possible
                    , match = bop.sparse( snip )
                    ;
                // if a match exists, set me.snip to the current temp snip
                if ( match.length && ( me.snip = snip ) ) {
                    if ( collect ) results.push( me.snip.slice( 0, match[ 0 ] ) );
                    else me.emit( 'snap', me.snip.slice( 0, match[ 0 ] ) );
                    // slice to parse from a new starting index
                    data = data.slice( match[ 0 ] + plen - olen );
                } else {
                    // TODO: inefficient when the previous snip was very large.
                    // NOTE: no match! we could bufferize, collecting multiple
                    // buffers which don't contain sequence, therefore delaying
                    // the data concatenation; however, for now, we concat only
                    // the previous chunk of data with the current.
                    data = bconcat( [ me.snip, data ] );
                    // update to the snip ending index
                    offset[ 0 ] = olen >= plen ? olen - plen : 0;
                }
            }
        }
        // use Bop.sparse to collect only non-overlapping sequences; two
        // contiguous results indexes should be divided, at least, by the
        // length of the sequence.
        // It starts to parse from updated index, if any snip was merged
        let matches = bop.sparse( data, offset[ 0 ] )
            , mlen = matches.length
            , l = matches[ 0 ]
            , i = 0
            , m = 0
            // choose previously, which fn to use
            , fn = ( () => ( collect ) ? 
                apush.bind( results ) :
                me.emit.bind( me, 'snap' ) )()
                ;
        // emit or push matches skipping empty results 
        for ( ; i < mlen; m = l + plen, l = matches[ ++i ] )
            if ( l > m ) fn( data.slice( m, l ) )
            ;
        // slice data if the array of matches is not empty
        // TODO: when sequence could not be found inside any chunks, the
        // snip size grows up, as the size of the total data received.
        me.snip = mlen ? data.slice( matches[ mlen - 1 ] + plen, data.length ) : data;
        // !! end, return remaining bytes
        if ( collect ) return results;
        // emit current remaining bytes
        me.emit( 'snip', me.snip );
    };

    aproto.flush = function ( collect ) {
        const me = this
            , snip = me.snip
            ;
        // emit/collect last snip and reset
        me.snip = Buffer.alloc( 0 );
        me.csnip = Buffer.alloc( 0 );
        me.cnt = 0;
        if ( collect ) return snip;
        me.emit( 'snip', snip );
    };

    aproto.set = function ( sequence ) {
        const me = this
            ;
        me.seq = check( sequence );
        me.bop.set( me.seq );
        me.snip = Buffer.alloc( 0 );
        me.csnip = Buffer.alloc( 0 );
        me.cnt = 0;
        return me;
    };

    aproto.count = function ( data ) {
        const me = this
            , bop = me.bop
            , plen = me.seq.length
            , olen = me.csnip.length
            ;
        if ( olen ) {
            // a snip of previous data exists
            // check if sequence is longer than remaining data
            if ( data.length < plen ) data = bconcat( [ me.csnip, data ] );
            else {
                // slice only necessary (sequence-length) bytes from data
                let csnip = bconcat( [ me.csnip, data.slice( 0, plen ) ] )
                    , match = bop.sparse( csnip )
                    ;
                // only 1 match is possible
                if ( match.length && ++me.cnt )
                    // slice to parse from a new starting index
                    data = data.slice( match[ 0 ] + plen - olen );
            }
        }
        // count only non-overlapping sequences
        let matches = bop.scount( data, 0 )
            , cnt = matches[ 0 ]
            ;
        me.cnt += cnt;
        // slice data to the next possible match
        me.csnip = data.slice( data.length - plen + 1 );
        return [ me.cnt ];
    };

    return Auntie;

} )();
