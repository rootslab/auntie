   // when sequence length === 1 we use a simpler naive method
module.exports = ( function () {

    const bconcat = Buffer.concat
        , ualloc = Buffer.allocUnsafe
        , apush = Array.prototype.push
        ;

    return {
        // naive do
        do ( data, collect ) {
            const me = this
                , p = me.seq
                , cnum = p[ 0 ]
                , dlen = data.length
                , cslen = me.snip.length
                , results = []
                , matches = []
                , apush = Array.prototype.push
                // fn to collect/emit data
                , fn = ( () => ( collect ) ? 
                    apush.bind( results ) :
                    me.emit.bind( me, 'snap' ) )()
                ;
            let i = 0
                , m = 0
                , l = null
                , mlen = 0
                ;
            for ( ; i < dlen; ++i ) if ( cnum === data[ i ] ) matches.push( i );
            mlen = matches.length;
            l = matches[ 0 ];
            i = 0;
            if ( ! mlen ) {
                // no results, save snip and return
                // TODO: implement buffering logic 
                me.snip = cslen ? bconcat( [ me.snip, data ] ) : data;
                return collect ? results : me.emit( 'snip', me.snip );
            }
            if ( cslen ) {
                let match = bconcat( [ me.snip, data.slice( 0, matches[ 0 ] ) ] )
                    ;
                if ( collect ) results.push( match );
                else me.emit( 'snap', match );
                i = 1;
            }
            // slice results
            for ( ; i < mlen; m = l + 1, l = matches[ ++i ] )
                if ( l > m ) fn( data.slice( m, l ) )
                ;
            me.snip = data.slice( matches[ mlen - 1 ] + 1 );
            // !! end, return remaining bytes
            return collect ? results : me.emit( 'snip', me.snip );
        }
        // naive count
        , count ( data ) {
             const me = this
                , cnt = me.cnt
                , cnum = me.seq[ 0 ]
                , dlen = data.length
                ;
            for ( let i = 0; i < dlen; ++i )
                if ( cnum === data[ i ] ) ++cnt[ 0 ];
            return [ cnt[ 0 ] ];
        }
    };

} )();