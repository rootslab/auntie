/*
 * Auntie, my dear ultra-fast module for untying/splitting 
 * a stream of data by a chosen sequence.
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
            me.max = 0;
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
            ;
        if ( olen ) {
            // a snip of previous data exists
            // check if sequence is longer than remaining data
            if ( data.length < plen ) data = bconcat( [ me.snip, data ] );
            else {
                // temporarily slice only necessary (sequence-length) bytes
                // TODO: inefficient when the previous snip was very large
                // RESP: parse from the end of snip
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
                }
            }
        }
        // use Bop.sparse to collect only non-overlapping sequences; two
        // contiguous indexes should be divided, at least, by the length
        // of the sequence.
        // TODO: inefficient when the previous snip merged was large, it
        // starts to parse (another time) from index 0. Update the index.
        let matches = bop.sparse( data )
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
        // slice data if matches array is not empty
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
        me.max = 0;
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
        me.max = 0;
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
                    , max = match[ 0 ]
                    ;
                // only 1 match is possible
                // TODO: max is erroneous, calculate it considering also
                // previous snips of data. 
                if ( match.length && ++me.cnt ) {
                    // slice to parse from a new starting index
                    data = data.slice( match[ 0 ] + plen - olen );
                    // update max property
                    me.max = max > me.max ? max : me.max;
                } else me.max = ( data.length > me.max ) ? data.length : me.max;
            }
        }
        // count only non-overlapping sequences
        let matches = bop.count( data, 0, true, true )
            , cnt = matches[ 0 ]
            , max = matches[ 1 ]
            ;
        me.cnt += cnt;
        me.max = max > me.max ? max : me.max;
        // slice data to the next possible match
        me.csnip = data.slice( data.length - plen + 1 );
        return [ me.cnt ];
    };

    return Auntie;

} )();
