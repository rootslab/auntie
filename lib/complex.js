// when the sequence is longer than 1 byte
module.exports = ( function () {

    const bconcat = Buffer.concat
        , ualloc = Buffer.allocUnsafe
        , apush = Array.prototype.push
        ;
    return {
        // complex do (default #do)
        do ( data, collect ) {
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
                // offset for parsing, when negative set to 0
                , offset = cslen - plen > 0 ? cslen - plen : 0
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
            // check for previous saved data
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
                me.snip = bconcat( [ me.snip, data ] );
                // !! end, return remaining bytes
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
                    // parsing data from correct index
                    , right = data.slice( jmatch + slen - sleft.length )
                    , rlen = right.length
                    ;
                // collect result if resulting Buffer is not empty
                if ( left.length ) fn( left );
                if ( rlen < 1 ) {
                    // rlen === 0, no more data
                    me.snip = ualloc( 0 );
                    // !! end, return remaining bytes
                    return collect ? results : me.emit( 'snip', me.snip );
                }
                // handle remaining data
                if ( rlen < slen ) {
                    // remaining data is smaller than sequence length,
                    // then save snip and return/emit results
                    me.snip = right;
                   // !! end, return remaining bytes
                   return collect ? results : me.emit( 'snip', me.snip );
                }
                // reset previous data
                me.snip = ualloc( 0 );
                // avoid to use an offset for parsing, set
                // the data immediately to the right slice.
                // TODO: avoid slicing and parsing data with offset?
                data = right;
            }
            // parse only new data
            let matches = bop.sparse( data )
                    , mlen = matches.length
                    , i = 0
                    , l = matches[ i ]
                    , m = 0
                    ;
            if ( ! mlen ) {
                // no match, concat buffers and return
                // TODO: delay concat? 
                me.snip = bconcat( [ me.snip, data ] );
                // !! end, return remaining bytes
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
            // !! end, return remaining bytes
            return collect ? results : me.emit( 'snip', me.snip );
        }
        // TODO, inefficient! 
        // complex #dist(ance)
        , dist ( data ) {
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
            // TODO: write better logic for code as for #count and #do
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
            cnt[ 3 ] = me.csnip.length;
            return cnt;
        }
        // complex count (default #count)
        , count ( data ) {
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
                , bconcat = Buffer.concat
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
            // if current snip is larger than slen - 1, slice unuseful data
            if ( offset > 0 ) csnip = me.csnip.slice( offset );
            // then concat with current short data and save snip
            me.csnip = bconcat( [ csnip, data ] );
            return [ cnt[ 0 ] ];
        }
    };

} )();