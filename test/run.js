#!/usr/bin/env node
( function () {
   require( 'dado' )().do( 'test' );
} )();

process.env.TRAVIS = 1