// load and collect results in sync way
module.exports = ( function () {
    const log = console.log
        , fs = require( 'fs' )
        , Bop = require( 'bop' )
        , sync_load_and_collect = function ( path, pattern, no_overlap ) {
            let data = fs.readFileSync( path )
                , bop = Bop( pattern )
                , matches = ( no_overlap ) ? bop.sparse( data ) : bop.parse( data )
                , mlen = matches.length
                , plen = pattern.length
                , l = matches[ 0 ]
                , i = 0
                , m = 0
                , results = []
                , dist = []
                ;
            for ( ; i < mlen; l = matches[ ++i ] ) {
                // skip empty results
                if ( l !== m ) results.push( data.slice( m, l ) ) && dist.push( l - m );
                m = l + plen;
            }
            return [ results, dist, matches, data.length ];
        }
        ;
    return sync_load_and_collect;
} )();