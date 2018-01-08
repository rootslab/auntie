/*
 * Auntie, my dear ultra-fast module for untying/splitting/counting  
 * a stream of data by a chosen sequence/separator.
 *
 * Copyright(c) 2017-present Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.Auntie = ( function () {

    const log = console.log
        , naive = require( './naive' )
        , complex = require( './complex' )
        , Bop = require( 'bop' )
        , { EventEmitter } = require( 'events' )
        , { inherits } = require( 'util' )
        , { circles , doString } = require( 'bolgia' )
        , ooo = circles
        , bconcat = Buffer.concat
        , bcompare = Buffer.compare
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

        // Auntie constructor
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
            me.gbop = Bop( ualloc( 0 ) );
            // if seq is made of a single char, assign naive function to #do 
            if ( me.seq.length === 1 )
                [ me.do, me.count ] = [ naive.do, naive.count ];
        }
        ;

    inherits( Auntie, EventEmitter );

    const aproto = Auntie.prototype;

    aproto.count = complex.count;

    aproto.do = complex.do;

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
        // if the sequence is made of a single char, assign the naive functions 
        [ me.do, me.count ] = ( me.seq.length > 1 ) ?
            [ complex.do, complex.count ] : [ naive.do, naive.count ];
        return me;
    };

    aproto.comb = function ( seq, data ) {
        const me = this
            , gbop = me.gbop
            , dlen = data.length
            , p = check( seq )
            , plen = p.length
            , cnum = p[ 0 ]
            ;
        if ( ! plen || dlen < plen ) return [];
        if ( plen === 1 ) {
            // single char code
            let matches = []
                , i = 0
                ;
            for ( ; i < dlen; ++i )
                if ( cnum === data[ i ] ) matches.push( i );
            return matches;
        }
        // check if the same pattern has been already set for the generic bop
        if ( bcompare( gbop.p, p ) !== 0 ) gbop.set( p );
        return gbop.parse( data );
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
        return cnt.concat( me.csnip.length );
    };

    return Auntie;

} )();