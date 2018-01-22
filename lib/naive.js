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
        // naive dist
        , dist ( data ) {
             const me = this
                , cnt = me.cnt
                , cnum = me.seq[ 0 ]
                , dlen = data.length
                ;
            let i = 0
                , occ = 0
                , prev = 0
                , clen = 0
                ;
            for ( ; i < dlen; ++i ) {
                if ( cnum === data[ i ] ) {
                    if ( ++occ === 1 ) {
                        // check for previous data
                        if ( cnt[ 3 ] ) {
                            clen = me.dst + i;
                            clen = cnt[ 3 ] + i;
                            cnt[ 3 ] = 0;
                        } else clen = i;
                    } else clen = i - prev;
                    prev = i + 1;
                    if ( clen < cnt[ 1 ] ) cnt[ 1 ] = clen;
                    else if ( clen > cnt[ 2 ] ) cnt[ 2 ] = clen;
                }
            }
            if ( occ ) {
                cnt[ 0 ] += occ;
                cnt[ 3 ] = i - prev;
            } else cnt[ 3 ] += dlen;
            return cnt;
        }
    };

} )();