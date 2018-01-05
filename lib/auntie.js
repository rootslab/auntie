/*
 * Auntie, my dear ultra-fast module for untying/splitting/counting  
 * a stream of data by a chosen sequence/separator.
 *
 * Copyright(c) 2017-present Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */


/*************************** TODO NOTES ************************************ /

TODO: write better logic for code as for #count

- where: #do and #dist
  - problem (a): write better code, as for #count
  - problem (b): implement new code logic for buffering

- note: scenario: no match for several chunks, the the snip will
        become very large. we could collect multiple buffers which
        don't contain the sequence sequence, therefore delaying the
        data concatenation; however, for now, we concat only the
        previous chunk of data with the current. the tonto way.

- missing tests for no match with #count, #dist

/****************************************************************************/

exports.Auntie = ( function () {

    const log = console.log
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
            // counter / parser
            , bop = me.bop
            // current recevied data length
            , dlen = data.length
            // previous saved data
            , cslen = me.csnip.length
            // sequence length
            , slen = me.seq.length
            // sequence length - 1 for offset
            , plen = slen - 1
            // internal counter
            , cnt = me.cnt
            // offset for parsing
            , offset = cslen - plen
            ;

        if ( ! cslen ) {
            // no previous snip, parse the current received data
            let [ mcnt, bleft ] = bop.scount( data );
            // save remaining bytes
            me.csnip = mcnt ? data.slice( dlen - bleft ) : data;
            // update internal counter and return matches
            return [ cnt[ 0 ] += mcnt ];
        }
        // a snip of previous data exists, check if the sequence
        // fits with the current available data (curr and previous)
        if ( slen > cslen + dlen ) {
            // no enough data to parse the sequence, concat buffers
            me.csnip = bconcat( [ me.csnip, data ] );
            return [ cnt[ 0 ] ];
        }
        // there are enough bytes of data to find the sequence
        // ( slen <= cslen + dlen ) between saved snip and curr
        // data, then slice only necessary bytes ( = slen - 1 )
        let csnip = bconcat( [ me.csnip, data.slice( 0, plen ) ] )
            // parse/count results, get match count and remaining bytes
            , [ mcnt, bleft ] = bop.scount( csnip, offset )
            ;
        // only 1 match at max is possible in the resulting snip
        if ( mcnt ) {
            // new result, increment counter
            ++me.cnt[ 0 ];
            // parse remaining bytes
            if ( bleft ) {
                // some bytes remaining
                [ mcnt, bleft ] = bop.scount( data, plen - bleft );
                if ( mcnt ) {
                    me.csnip = data.slice( dlen - bleft );
                    return [ cnt[ 0 ] += mcnt ];
                }
                // save the snip, slicing bytes already parsed  
                me.csnip = data.slice( dlen - slen + 1 );
                return [ cnt[ 0 ] ];
            }
            // no enough data in the concatenad snip, discard the previous
            // saved csnip and parse only the current data starting from
            // the updated index ( = cslen - offset = slen - 1 ).
            [ mcnt, bleft ] = bop.scount( data, plen );
            if ( mcnt ) {
                me.csnip = data.slice( dlen - bleft );
                return [ cnt[ 0 ] += mcnt ];
            }
            // save the snip, slicing bytes already parsed  
            me.csnip = data.slice( plen );
            return [ cnt[ 0 ] ];
        }
        // no match, try to parse only new received data
        if ( dlen > plen ) {
            // sequence fits with
            [ mcnt, bleft ] = bop.scount( data );
            if ( mcnt ) {
                me.csnip = data.slice( dlen - bleft );
                return [ cnt[ 0 ] += mcnt ];
            }
            // no results, set snip equal to current data
            me.csnip = data;
            return [ cnt[ 0 ] ];
        }
        ;
        // no match and sequence doesn't fit ( dlen < slen )
        // if current snip is larger tgan slen - 1 slice unuseful data
        if ( offset > 0 ) csnip = me.csnip.slice( offset );
        // then concat with current short data and save snip
        me.csnip = bconcat( [ csnip, data ] );
        return [ cnt[ 0 ] ];
    };

    aproto.do = function ( data, collect ) {
        const me = this
            // counter / parser
            , bop = me.bop
            // current recevied data length
            , dlen = data.length
            // previous saved data for #do
            , cslen = me.snip.length
            // sequence length
            , slen = me.seq.length
            // sequence length - 1 for offset
            , plen = slen - 1
            // offset for parsing
            , offset = cslen - plen
            // array for collecting results
            , results = collect ? [] : null
            // fn to collect/emit data
            , fn = ( () => ( collect ) ? 
                apush.bind( results ) :
                me.emit.bind( me, 'snap' ) )()
            // fn for splitting data, it parses results, executes an "eat" fn
            // on every slice, then returns arrray of match indexes. It uses
            // strict parse to collect only results from non-overlapping 
            // sequences (two contiguous results indexes should be divided,
            // at least, by the length of the sequence).
            , split = function ( data, offset, eat ) {
                let efn = eat || fn
                    , matches = bop.sparse( data, offset )
                    , mlen = matches.length
                    , i = 0
                    , m = 0
                    , l = matches[ 0 ]
                    ;
                // emit or push matches skipping empty results 
                for ( ; i < mlen; m = l + slen, l = matches[ ++i ] )
                    if ( l > m ) efn( data.slice( m, l ) )
                    ;
                return matches;
            }
            ;
        // check for previuos saved data
        if ( ! cslen ) {
            // no previous snip, parse the current received data and collect result
            let matches = split( data )
                , mlen = matches.length
                ;
            me.snip = mlen ? data.slice( matches[ mlen - 1 ] + slen ) : data;
            // !! end, return remaining bytes
            return collect ? results : me.emit( 'snip', me.snip );
        }
        // a snip of previous data exists, check if the sequence
        // fits with the current available data (curr and previous)
        // it's equal to test for offset + dlen < 1
        if ( slen > cslen + dlen ) {
            // no enough data to parse the sequence, concat buffers
            // TODO: buffering
            me.snip = bconcat( [ me.snip, data ] );
            return collect ? results : me.emit( 'snip', me.snip );
        }
        // check for overlapping sequences between the old data
        // and current data, slice only the data needed from the
        // 2 buffers and concat. Resulting length will be in the
        // interval: [ slen, 2*(slen-1) ].
        let sleft = me.snip.slice( offset )
            , sright = data.slice( 0, plen )
            // concat 2 buffers
            , join = bconcat( [ sleft, sright ] )
            // parse unique result
            , jresults = bop.sparse( join )
            // first match index
            , jmatch = -1
            ;
        // check for match, only one match is possible
        if ( jresults.length ) {
            // update match index
            jmatch = jresults[ 0 ];
            // slice the left result, with the current match offset
            let left = me.snip.slice( 0, offset + jmatch )
                // parsing data from index = jmatch + 1
                , right = data.slice( jmatch + 1 )
                ;
            // collect result
            fn( left );
            // handle remaining data
            if ( right.length < slen ) {
                // remaining data is smaller than sequence length,
                // save snip and return
                me.snip = right;
                return collect ? results : me.emit( 'snip', me.snip );
            }
            // reset previous data
            me.snip = ualloc( 0 );
            // avoid to use an offset for parsing, set
            // the data immediately to the right slice.
            // TODO: could be better
            data = right;
        }
        // parse only data
        let matches = bop.sparse( data )
                , mlen = matches.length
                , i = 0
                , l = matches[ i ]
                , m = 0
                ;
        if ( ! mlen ) {
            // no match, concat buffers and return
            // TODO: buffering
            me.snip = bconcat( [ me.snip, data ] );
            return collect ? results : me.emit( 'snip', me.snip );
        }
        if ( ! ~ jmatch ) {
            // if jmatch === -1, no overlapping match have been previously
            // found, then concat data for collecting the 1st match
            fn( bconcat( [ me.snip, data.slice( 0, matches[ 0 ] ) ] ) );
            // update indexes
            m = matches[ i++ ] + slen;
            l = matches[ i ];
        }
        // emit or push matches skipping empty results 
        for ( ; i < mlen; m = l + slen, l = matches[ ++i ] )
            if ( l > m ) fn( data.slice( m, l ) );

        me.snip = data.slice( matches[ mlen - 1 ] + slen );
        return collect ? results : me.emit( 'snip', me.snip );
        /** /
        // TODO: write better logic for code as for #count
        // FIX: simple, inefficient code
        data = bconcat( [ me.snip, data ] );
        matches = split( data, offset )
        mlen = matches.length
        me.snip = data.slice( matches[ mlen - 1 ] + slen );
        return collect ? results : me.emit( 'snip', me.snip );
        /**/
    };

    aproto.dist = function ( data ) {
       const me = this
            // counter / parser
            , bop = me.bop
            // internal counter
            , cnt = me.cnt
            // previous saved data
            , cslen = me.csnip.length
            // sequence length
            , slen = me.seq.length
            // sequence length - 1 for offset
            , plen = slen - 1
            // offset for parsing
            , offset = cslen - plen
            // fn for parsing/analyzing results
            , analyze = function ( data, offset ) {
                let matches = bop.sparse( data, offset )
                    , mlen = matches.length
                    , l = matches[ 0 ]
                    , i = 0
                    , m = 0
                    , len = 0
                    ;
                // emit or push matches skipping empty results 
                for ( ; i < mlen; m = l + slen, l = matches[ ++i ] )
                    if ( len = l - m )
                        if ( len < cnt[ 1 ] ) cnt[ 1 ] = len;
                        else if ( len > cnt[ 2 ] ) cnt[ 2 ] = len;
                return matches;
            }
            ;
        // TODO: write better logic for code as for #count
     
        // simple but inefficient code
        data = bconcat( [ me.csnip, data ] );

        let matches = analyze( data, offset )
            , mlen = matches.length
            ;
        // slice data if the array of matches is not empty
        me.csnip = mlen ? 
                data.slice( matches[ mlen - 1 ] + slen ) :
                data
                ;
        cnt[ 0 ] += mlen;
        return cnt.concat( me.csnip.length );
    };

    return Auntie;

} )();