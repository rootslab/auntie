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
        , Bop = require( 'bop' )
        , { EventEmitter } = require( 'events' )
        , { inherits } = require( 'util' )
        , { circles , doString } = require( 'bolgia' )
        , ooo = circles
        , bconcat = Buffer.concat
        , apush = Array.prototype.push
        , ualloc = Buffer.allocUnsafe
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
            me.snip = ualloc( 0 );
            // for counter
            me.csnip = Buffer.alloc( 0 );
            me.cnt = [ 0, Infinity, -Infinity ];
        }
        ;

    inherits( Auntie, EventEmitter );

    const aproto = Auntie.prototype;

    aproto.flush = function ( collect ) {
        const me = this
            , snip = me.snip
            ;
        // emit/collect last snip and reset
        me.snip = ualloc( 0 );
        me.csnip = ualloc( 0 );
        me.cnt = [ 0, Infinity, -Infinity ];
        if ( collect ) return snip;
        me.emit( 'snip', snip );
    };

    aproto.set = function ( sequence ) {
        const me = this
            ;
        me.seq = check( sequence );
        me.bop.set( me.seq );
        me.snip = ualloc( 0 );
        me.csnip = ualloc( 0 );
        me.cnt = [ 0, Infinity, -Infinity ];
        return me;
    };

    aproto.count = function ( data ) {
        const me = this
            , bop = me.bop
            , dlen = data.length
            , plen = me.seq.length
            , cslen = me.csnip.length
            , cnt = me.cnt
            ;
        let result = null
            , offset = 0
            ;

        if ( ! cslen ) {
            // no previous snip
            result = bop.scount( data );
            me.csnip = result[ 0 ] ? data.slice( dlen - result[ 1 ] ) : data;
            return [ cnt[ 0 ] += result[ 0 ] ];
        }

        // a snip of previous data exists

        // check if sequence fits
        if ( plen > cslen + dlen ) {
            // no enough data to parse the sequence, concat buffers
            me.csnip = bconcat( [ me.csnip, data ] );
            return [ cnt[ 0 ] ];
        }
        // there are enough bytes of data to find the sequence
        // ( plen <= cslen + dlen ) between saved snip and curr
        // data, then slice only necessary bytes ( = plen - 1 )
        let csnip = bconcat( [ me.csnip, data.slice( 0, plen - 1 ) ] )
            ;
        
        // set offset for parsing to the first possbile index
        offset = cslen - plen + 1;

        // parse/count results
        result = bop.scount( csnip, offset );

        // only 1 match at max is possible
        if ( result[ 0 ] ) {
            // TODO
            // increment counter
            //++me.cnt[ 0 ];
            /** /
            // parse remaining bytes
            if ( result[ 1 ] ) {
                // offset for the current data (from 0 to plen - 1)
                offset = dlen - result[ 1 ];
                result = bop.scount( data,  offset );
                me.csnip = result[ 0 ] ? data.slice( offset ) : data;
                return [ cnt[ 0 ] += result[ 0 ] ];
            }
            // no enough data, 0 bytes to parse
            me.csnip = Buffer.allocUnsafe( 0 );
            return [ cnt[ 0 ] ];
            /**/
            /**/
            data = bconcat( [ me.csnip, data ] );
            result = bop.scount( data, offset );
            me.csnip = result[ 0 ] ? data.slice( dlen - result[ 1 ] ) : data;
            return [ cnt[ 0 ] += result[ 0 ] ];
            /**/
        }

        // no match, try to parse only new received data
        if ( dlen >= plen ) {
            result = bop.scount( data );

            if ( result[ 0 ] ) {
                me.csnip = data.slice( dlen - result[ 1 ] );
                return [ cnt[ 0 ] += result[ 0 ] ];
            }
            // no results, set snip equal to current data
            me.csnip = data;
            return [ cnt[ 0 ] ];
        }
        ;
        // no match and sequence doesn't fit ( dlen < plen )
        // if current snip is larger tgan plen - 1 slice unuseful data
        if ( offset > 0 ) csnip = me.csnip.slice( offset );
        // then concat with current short data and save snip
        me.csnip = bconcat( [ csnip, data ] );
        return [ cnt[ 0 ] ];

    };

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
            , ldiff = slen - plen + 1
            ;
        /* TODO - FIX CODE BELOW * /
        if ( slen ) {    
            // a snip of previous data exists, temporarily slice only
            // necessary (sequence-length) bytes.
            // TODO: inefficient, firstly check if the current snip length
            // is larger or equal to the pattern length, then slice only
            // the last plen - 1 bytes
            let snip = bconcat( [ me.snip, data.slice( 0, plen ) ] )
                // diff between lengths of the curr snip and pattern
                // it could be negative
                , diff = slen - plen
                // parse from the next possible index
                // TODO: FIX code
                // negative offset values will be set to 0 by Bop
                , match = bop.sparse( snip, snip.length - plen )
                ;
            // only 1 match at max is possible
            // TODO: BRANCH NOT REACHABLE 
            if ( match.length ) {
                fn( snip.slice( 0, match[ 0 ] ) );
                // offset to the last possible index
                offset = match[ 0 ] - diff;
            } else {
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
        /**/
        
        // simple but inefficient code
        data = bconcat( [ me.snip, data ] );
        // negative offset values will be set to 0 by Bop
        offset = ldiff;
        
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
                  data.slice( matches[ mlen - 1 ] + plen ) :
                  data
                  ;
        // !! end, return remaining bytes
        if ( collect ) return results;
        // emit current remaining bytes
        me.emit( 'snip', me.snip );
    };


    aproto.dist = function ( data ) {
        const me = this
            , bop = me.bop
            , plen = me.seq.length
            , cslen = me.csnip.length
            , cnt = me.cnt
            ;
        let offset = 0
            , ldiff = cslen - plen + 1
            ;
        /* TODO - FIX CODE BELOW * /
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
        /**/
        
        // simple but inefficient code
        data = bconcat( [ me.csnip, data ] );
        offset = ldiff;

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
                data.slice( matches[ mlen - 1 ] + plen ) :
                data
                ;
        cnt[ 0 ] += mlen;
        return cnt.concat( me.csnip.length );
    };

    return Auntie;

} )();
