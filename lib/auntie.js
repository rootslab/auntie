/*
 * Auntie, my dear ultra-fast module for untying/splitting/counting  
 * a stream of data by a chosen sequence/separator.
 *
 * Copyright(c) 2017-present Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.Auntie = ( function () {

    const log = console.log
        , max = Math.max
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
            me.cnt = [ 0, Infinity, -Infinity ];
        }
        ;

    util.inherits( Auntie, emitter );

    const aproto = Auntie.prototype;
    
    aproto.do = function ( data, collect ) {
        const me = this
            , bop = me.bop
            , plen = me.seq.length
            , slen = me.snip.length
            , results = collect ? [] : null
             // fn to collect/emit data
            , fn = ( () => ( collect ) ? 
                apush.bind( results ) :
                me.emit.bind( me, 'snap' ) )()
            ;
        let offset = 0
            ;
        if ( slen ) {
            // a snip of previous data exists
            // temporarily slice only necessary (sequence-length) bytes
            let snip = bconcat( [ me.snip, data.slice( 0, plen ) ] )
                // diff between lengths of the curr snip and pattern
                // it could be negative
                , diff = slen - plen
                // parse from the next possible index
                // negative offset values will be set to 0 by Bop
                , match = bop.sparse( snip, snip.length - plen + 1 )
                ;
            // only 1 match at max is possible
            if ( match.length && fn( snip.slice( 0, match[ 0 ] ) ) )
                // offset to the last possible index
                offset = match[ 0 ] - diff;
            else {
                // TODO: inefficient when the previous snip was very large.
                // NOTE: no match! we could bufferize, collecting multiple
                // buffers which don't contain sequence, therefore delaying
                // the data concatenation; however, for now, we concat only
                // the previous chunk of data with the current.
                data = bconcat( [ me.snip, data ] );
                // update value to the next possible matching index
                // negative offset values will be set to 0 by Bop
                offset = diff;
            }
        }
        // use Bop.sparse to collect only non-overlapping sequences; two
        // contiguous results indexes should be divided, at least, by the
        // length of the sequence.
        let matches = bop.sparse( data, offset )
            , mlen = matches.length
            , l = matches[ 0 ]
            , i = 0
            , m = 0
            ;
        // emit or push matches skipping empty results 
        for ( ; i < mlen; m = l + plen, l = matches[ ++i ] )
            if ( l > m ) fn( data.slice( m, l ) )
            ;
        // slice data if the array of matches is not empty
        // TODO: when sequence could not be found inside any chunks, the
        // snip size grows up, as the size of the total data received.
        me.snip = mlen ? 
                  data.slice( matches[ mlen - 1 ] + plen, data.length ) :
                  data
                  ;
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
        me.cnt = [ 0, Infinity, -Infinity ];
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
        me.cnt = [ 0, Infinity, -Infinity ];
        return me;
    };

    aproto.count = function ( data ) {
        const me = this
            , bop = me.bop
            , plen = me.seq.length
            , cslen = me.csnip.length
            , cnt = me.cnt
            ;
        let offset = 0
            ;
        if ( cslen ) {
            // a snip of previous data exists
            // temporarily slice only necessary (sequence-length) bytes
            let snip = bconcat( [ me.csnip, data.slice( 0, plen ) ] )
                // diff between lengths of the curr snip and pattern
                // it could be negative
                , diff = cslen - plen
                // parse from the next possible index
                // negative offset values will be set to 0 by Bop
                , match = bop.sparse( snip, snip.length - plen + 1 )
                , len = match[ 0 ]
                ;
            // only 1 match at max is possible, offset to the last possible index
            if ( match.length && ++me.cnt[ 0 ] ) offset = len - diff;              
            else data = bconcat( [ diff < 0 ? me.csnip : me.csnip.slice( diff + 1 ), data ] )
        }
        let matches = bop.scount( data, offset )
            , m = matches[ 0 ]
            ;
        me.csnip = m ? data.slice( data.length - matches[ 1 ] ) : data;
        cnt[ 0 ] += m;
        return [ cnt[ 0 ] ];
    };

    aproto.dist = function ( data ) {
        const me = this
            , bop = me.bop
            , plen = me.seq.length
            , cslen = me.csnip.length
            , cnt = me.cnt
            ;
        let offset = 0
            ;
        if ( cslen ) {
            // a snip of previous data exists
            // temporarily slice only necessary (sequence-length) bytes
            let snip = bconcat( [ me.csnip, data.slice( 0, plen ) ] )
                // diff between lengths of the curr snip and pattern
                // it could be negative
                , diff = cslen - plen
                // parse from the next possible index
                // negative offset values will be set to 0 by Bop
                , match = bop.sparse( snip, snip.length - plen + 1 )
                , len = match[ 0 ]
                ;
            // only 1 match at max is possible
            if ( match.length && ++me.cnt[ 0 ] ) {
                if ( len < cnt[ 1 ] ) cnt[ 1 ] = len;
                else if ( len > cnt[ 2 ] ) cnt[ 2 ] = len;
                // snip.slice( 0, match[ 0 ] );
                // offset to the last possible index
                offset = len - diff;
            } else {
                data = bconcat( [ me.csnip, data ] );
                // update value to the next possible matching index
                // negative offset values will be set to 0 by Bop
                offset = diff;
            }
        }
        // use Bop.sparse to collect only non-overlapping sequences; two
        // contiguous results indexes should be divided, at least, by the
        // length of the sequence.
        let matches = bop.sparse( data, offset )
            , mlen = matches.length
            , l = matches[ 0 ]
            , i = 0
            , m = 0
            , len = 0
            ;
        // emit or push matches skipping empty results 
        for ( ; i < mlen; m = l + plen, l = matches[ ++i ] )
            if ( len = l - m )
                if ( len < cnt[ 1 ] ) cnt[ 1 ] = len;
                else if ( len > cnt[ 2 ] ) cnt[ 2 ] = len;
        // slice data if the array of matches is not empty
        me.csnip = mlen ? 
                data.slice( matches[ mlen - 1 ] + plen, data.length ) :
                data
                ;
        cnt[ 0 ] += mlen;
        return cnt.concat( me.csnip.length );
    };

    return Auntie;

} )();
