// Copyright 2017-2019, University of Colorado Boulder

/**
 * Query parameters for inverse-square-law-common
 *
 * @author Jesse Greenberg
 */
define( require => {
  'use strict';

  // modules
  const inverseSquareLawCommon = require( 'INVERSE_SQUARE_LAW_COMMON/inverseSquareLawCommon' );

  const ISLCQueryParameters = QueryStringMachine.getAll( {

    // when flagged, shows a grid in the ScreenView that visualizes the possible positions
    // for the objects (kept after code review for future development debugging)
    showGrid: {
      type: 'flag'
    },

    // Add horizontal lines at the ruler region boundaries, add crosshairs on the ruler so you can see the point that
    // is being tested, and print the region names to the console, so you can see them in the developer tools.
    showRulerRegions: {
      type: 'flag'
    },

    // Shows boundary positions of the two objects, as .  The boundary positions for each
    // object will change depending on the size and position of both objects.
    showDragBounds: { type: 'flag' }
  } );

  inverseSquareLawCommon.register( 'ISLCQueryParameters', ISLCQueryParameters );

  return ISLCQueryParameters;
} );
