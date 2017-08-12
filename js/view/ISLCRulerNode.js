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
  var Util = require( 'DOT/Util' );
  var Vector2 = require( 'DOT/Vector2' );
  var Node = require( 'SCENERY/nodes/Node' );

  // constants
  var RULER_WIDTH = 500;
  var RULER_HEIGHT = 35;
  var RULER_INSET = 10;

  // strings
  var unitsMetersString = require( 'string!INVERSE_SQUARE_LAW_COMMON/units.meters' );

  /**
   * @param {InverseSquareLawModel} model
   * @param {number} screenHeight
   * @param {ModelViewTransform2} modelViewTransform
   * @param {Tandem} tandem
   * @constructor
   */
  function ISLCRulerNode( model, screenHeight, modelViewTransform, tandem, options ) {

    options = _.extend( {
      snapToNearest: null,
    }, options );
    Node.call( this, { cursor: 'pointer', cssTransform: true, tandem: tandem } );
    var ruler = new RulerNode(
      RULER_WIDTH,
      RULER_HEIGHT,
      50,
      [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10' ],
      unitsMetersString,
      {
        backgroundFill: '#ddd',
        insetsWidth: RULER_INSET,
        minorTicksPerMajorTick: 4,
        majorTickFont: new PhetFont( 12 ),
        snapToNearest: options.snapToNearest ? options.snapToNearest : 0,
        unitsFont: new PhetFont( 10 ),
        unitsSpacing: 3,
        tandem: tandem.createTandem( 'ruler' )
      }
    );
    this.addChild( ruler );

    model.rulerPositionProperty.link( function( value ) {
      ruler.translation = modelViewTransform.modelToViewPosition( value );
    } );

    // ruler drag bounds (in model coordinate frame) - assumes a single point scale inverted Y mapping
    var modelHeight = modelViewTransform.viewToModelDeltaY( screenHeight );
    var modelRulerHeight = modelViewTransform.viewToModelDeltaY( this.height );
    var modelRulerWidth = modelViewTransform.viewToModelDeltaX( this.width );

    var minX = model.leftObjectBoundary;
    var minY = modelHeight / 2 - modelRulerHeight; // bottom bound because Y is invered
    var maxX = model.rightObjectBoundary - modelRulerWidth;
    var maxY = -modelHeight / 2; // top bound because Y is inverted
    var bounds = new Bounds2( minX, minY, maxX, maxY );

    this.addInputListener( new MovableDragHandler( model.rulerPositionProperty, {
      dragBounds: bounds,
      tandem: tandem.createTandem( 'dragHandler' ),
      modelViewTransform: modelViewTransform,

      onDrag: function( event ) {

        // snap to nearest snapToNearest if specified
        if ( options.snapToNearest ) {

          // x in model coordinates
          var xModel = model.rulerPositionProperty.get().x;
          
          var snappedX = Util.roundSymmetric( xModel / options.snapToNearest ) * options.snapToNearest;

          // var offsetX = modelViewTransform.viewToModelDeltaX( RULER_INSET );
          model.rulerPositionProperty.set( new Vector2( snappedX , model.rulerPositionProperty.get().y ) );
        }
      }
    } ) );
  }

  inverseSquareLawCommon.register( 'ISLCRulerNode', ISLCRulerNode );

  return inherit( Node, ISLCRulerNode );
} );
