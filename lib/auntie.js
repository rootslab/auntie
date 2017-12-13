/*
 * Auntie, my dear ultra-fast module for untying/splitting
 * a stream of data with a choosen pattern.
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
        // default pattern
        , crlf =  Buffer.from( '\r\n' )
        // check input type
        , check = ( pattern ) => {
            switch ( doString( pattern ) ) {
                case ooo.num:
                    pattern = String( pattern );
                case ooo.str:
                    pattern = Buffer.from( pattern );
                case ooo.buf:
                 if ( pattern.length ) break;
                default:
                   pattern = crlf;
                break;
            };
            return pattern;
        }
        , Auntie = function ( pattern ) {
            const me = this
                , is = me instanceof Auntie
                ;
            if ( ! is ) return new Auntie( pattern );
            me.pattern = check( pattern );
            me.bop = Bop( me.pattern );
            me.snip = Buffer.alloc( 0 );
        }
        ;

    util.inherits( Auntie, emitter );

    const aproto = Auntie.prototype;
    
    aproto.do = function ( data, collect ) {
        const me = this
            , bop = me.bop
            , plen = me.pattern.length
            , olen = me.snip.length
            , results = collect ? [] : null
            ;
        // there is a snip of previous data?
        if ( olen ) {
            // check if pattern is longer than remaining data
            if ( data.length < plen ) data = bconcat( [ me.snip, data ] );
            else {
                // temporarily slice only necessary bytes from data; to check
                // if pattern exists. we slice pattern length bytes.
                let snip = bconcat( [ me.snip, data.slice( 0, plen ) ] )
                    // note that it should be only 1 match between 2 chunks of data
                    , match = bop.parse( snip )[ 0 ]
                    ;
                // if a match exists, set me.snip to the current temp snip
                if ( match && ( me.snip = snip ) ) {
                    if ( collect ) results.push( me.snip.slice( 0, match ) );
                    else me.emit( 'snap', me.snip.slice( 0, match ) );
                    // slice to parse from a new starting index
                    data = data.slice( match + plen - olen );
                } else {
                    // no match! we could bufferize, collecting multiple buffers
                    // which don't contain pattern, therefore delaying the data
                    // concatenation; however, for now, we concat only the previous
                    // chunk of data with the current.
                    data = bconcat( [ me.snip, data ] );
                }
            }
        }
        // use Bop#sparse to collect only non-overlapping results, two
        // contiguous indexes should be divided, at least, by the length
        // of the pattern.
        let matches = bop.sparse( data )
            , checked = []
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
        if ( collect ) return snip;
        me.emit( 'snip', snip );
    };

    aproto.set = function ( pattern ) {
        const me = this
            ;
        me.pattern = check( pattern );
        me.bop.set( me.pattern );
        me.snip = Buffer.alloc( 0 );
        return me;
    };

    return Auntie;

} )();
