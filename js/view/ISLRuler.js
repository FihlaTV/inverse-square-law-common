// Copyright 2013-2015, University of Colorado Boulder

/**
 * The draggable horizontal ruler.
 *
 * @author Anton Ulyanov (Mlearner)
 */
define( function( require ) {
  'use strict';

  // modules
  var Bounds2 = require( 'DOT/Bounds2' );
  var inverseSquareLawCommon = require( 'INVERSE_SQUARE_LAW_COMMON/inverseSquareLawCommon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var MovableDragHandler = require( 'SCENERY_PHET/input/MovableDragHandler' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var RulerNode = require( 'SCENERY_PHET/RulerNode' );
  var Node = require( 'SCENERY/nodes/Node' );

  // constants
  var RULER_WIDTH = 500;
  var RULER_HEIGHT = 35;

  // strings
  var unitsMetersString = require( 'string!INVERSE_SQUARE_LAW_COMMON/units.meters' );

  /**
   * @param {InverseSquareLawModel} model
   * @param {number} screenWidth
   * @param {number} screenHeight
   * @param {Tandem} tandem
   * @constructor
   */
  function ISLRuler( model, screenWidth, screenHeight, tandem ) {
    var self = this;
    Node.call( this, { cursor: 'pointer', cssTransform: true, tandem: tandem } );
    var ruler = new RulerNode(
      RULER_WIDTH,
      RULER_HEIGHT,
      50,
      [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10' ],
      unitsMetersString,
      {
        backgroundFill: 'grey',
        insetsWidth: 7,
        minorTicksPerMajorTick: 4,
        majorTickFont: new PhetFont( 12 ),
        unitsFont: new PhetFont( 10 ),
        unitsSpacing: 3,
        tandem: tandem.createTandem( 'ruler' )
      }
    );
    this.addChild( ruler );

    model.rulerPositionProperty.link( function( value ) {
      ruler.translation = value;
    } );

    this.addInputListener( new MovableDragHandler( model.rulerPositionProperty, {
      dragBounds: new Bounds2( -self.width / 2, 0, screenWidth - self.width / 2, screenHeight - self.height ),
      tandem: tandem.createTandem( 'dragHandler' )
    } ) );
  }

  inverseSquareLawCommon.register( 'ISLRuler', ISLRuler );

  return inherit( Node, ISLRuler );
} );
