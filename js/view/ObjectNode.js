// Copyright 2017, University of Colorado Boulder

/**
 * A common type for object views in sims that use inverse-square-law-common. The objects have a shaded sphere with a
 * puller/pusher robot attached that updates based on the model object values.
 * 
 * @author Michael Barlow
 * @author Jesse Greenberg
 */

define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var inverseSquareLawCommon = require( 'INVERSE_SQUARE_LAW_COMMON/inverseSquareLawCommon' );
  var Node = require( 'SCENERY/nodes/Node' );
  var TandemSimpleDragHandler = require( 'TANDEM/scenery/input/TandemSimpleDragHandler' );
  var InverseSquareLawCommonConstants = require( 'INVERSE_SQUARE_LAW_COMMON/InverseSquareLawCommonConstants' );
  var ISLForceArrowNode = require( 'INVERSE_SQUARE_LAW_COMMON/view/ISLForceArrowNode' );
  var Util = require( 'DOT/Util' );
  var Circle = require( 'SCENERY/nodes/Circle' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var PullerPusherNode = require( 'INVERSE_SQUARE_LAW_COMMON/view/PullerPusherNode' );
  var Shape = require( 'KITE/Shape' );
  var Path = require( 'SCENERY/nodes/Path' );
  var Text = require( 'SCENERY/nodes/Text' );

  // constants
  var LABEL_MAX_WIDTH = 20; // empirically determined through testing with long strings
  var OFFSET = 10; // empirically determined to make sure minimum force doesn't go to zero when rounded to 12 significant digits
  /**
   * TODO: This is a lot of constructor args. Can we abstract some things out?
   * TODO: I think the ObjectNode should create the PullerNode and the ArrowNode on its own, move those back to this 
   * file.
   * 
   * @constructor
   * @param {ISLModel} model
   * @param {ISLObjectModel} objectModel
   * @param {Bounds2} layoutBounds - bounds of the screen view containing the object
   * @param {ModelViewTransform2} modelViewTransform
   * @param {PullerNode} pullerNode
   * @param {ISLForceArrowNode} arrowNode
   * @param {Tandem} tandem
   * @param {Object} options
   */
  function ObjectNode( model, objectModel, layoutBounds, modelViewTransform, pullForceRange, arrowForceRange, tandem, options ) {

    options = _.extend( {
      label: 'This Object',
      otherObjectName: 'Other Object',
      defaultDirection: 'left',
      arrowColor: '#66f', // color of vertical line - TODO: what is this?
      y: 250,
      forceArrowHeight: 150, // height of arrow in view coordinates
      forceReadoutDecimalPlaces: 12, // number of decimal places in force readout
      snapToNearest: null // {number} if present, object node will snap to the nearest snapToNearest value on drag
    }, options );

    Node.call( this, { tandem: tandem } );

    // @private - the puller node
    this.pullerNode = new PullerPusherNode( pullForceRange, tandem.createTandem( 'puller1' ), options );

    if ( options.defaultDirection === 'right' ) {
      this.pullerNode.scale( -1, 1 );
    }

    // @private - arrow node
    var arrowNode = new ISLForceArrowNode(  arrowForceRange, 
                                            layoutBounds, 
                                            tandem.createTandem( 'forceArrowNode' ),
                                            options );

    // a parent node that applies the drag handler
    var dragNode = new Node( {
      cursor: 'pointer',
      tandem: tandem.createTandem( 'dragNode' )
    } );

    if ( options.direction === 'right' ) {
      this.pullerNode.scale( -1, 1 );
    }

    // the 'object' - a shaded circle
    var radius = modelViewTransform.modelToViewDeltaX( objectModel.radiusProperty.get() );
    this.objectCircle = new Circle( radius );

    dragNode.addChild( this.pullerNode );
    dragNode.addChild( this.objectCircle );

    // TODO: What is this circle doing here?
    dragNode.addChild( new Circle( 2, { fill: '#000' } ) );

    // add the label
    var labelFont = new PhetFont( 12 );
    dragNode.addChild( new Text( options.label, {
      font: labelFont,
      fill: '#000',
      pickable: false,
      maxWidth: LABEL_MAX_WIDTH,
      centerX: 0,
      top: 4,
      tandem: tandem.createTandem( 'labelShadowNode' )
    } ) );

    this.addChild( dragNode );
    this.y = options.y;

    // the marker line, connecting the arrow to the object
    // TODO: Why are there two paths?
    var markerLineShape = new Shape();
    markerLineShape.moveTo( 0, -4 );
    markerLineShape.lineTo( 0, -options.forceArrowHeight );
    this.addChild( new Path( markerLineShape, {
      stroke: '#FFF',
      lineDash: [ 4, 4 ],
      lineWidth: 2,
      x: 0.5,
      y: 0.5,
      tandem: tandem.createTandem( 'markerLineShadow' )
    } ) );
    this.addChild( new Path( markerLineShape, {
      stroke: options.arrowColor,
      lineDash: [ 4, 4 ],
      lineWidth: 2,
      tandem: tandem.createTandem( 'markerLine' )
    } ) );

    this.addChild( arrowNode );

    var self = this;

    // redraw view without shift
    var redrawForce = function() {
      self.objectCircle.setRadius( modelViewTransform.modelToViewDeltaX( objectModel.radiusProperty.get() ) );
      self.updateGradient( objectModel.baseColorProperty.get() );

      // update the arrow label
      arrowNode.updateLabel( model.forceProperty.get(), model.showValuesProperty.get() );

      // set the text position, positioning the center relative to the parent coordinate frame
      arrowNode.setArrowTextPosition( self.localToParentPoint( arrowNode.arrowText.center ), self.parentToLocalBounds( layoutBounds ) );

      // set the scale of the arrow based on the model value
      arrowNode.redrawArrow( model.forceProperty.get() );

      // update puller node visibility
      self.pullerNode.setPull( model.forceProperty.get(), self.objectCircle.width / 2 );
    };

    objectModel.positionProperty.link( function( prop ) {
      self.x = modelViewTransform.modelToViewX( prop );
    } );

    model.showValuesProperty.lazyLink( redrawForce );
    objectModel.radiusProperty.lazyLink( redrawForce );
    model.forceProperty.lazyLink( redrawForce );

    objectModel.baseColorProperty.link( function( baseColor ) {
      self.updateGradient( baseColor );
    } );

    redrawForce();

    var clickOffset;
    dragNode.addInputListener( new TandemSimpleDragHandler( {
      allowTouchSnag: true,
      start: function( event ) {
        clickOffset = dragNode.globalToParentPoint( event.pointer.point ).x - event.currentTarget.x;
      },
      drag: function( event ) {

        // drag position relative to the pointer pointer start position
        var x = self.globalToParentPoint( event.pointer.point ).x - clickOffset;

        // absolute drag bounds (before considering the other object)
        var xMax = layoutBounds.maxX - self.objectCircle.width / 2 - self.pullerNode.width - OFFSET;
        var xMin = layoutBounds.minX + OFFSET + self.objectCircle.width / 2 + self.pullerNode.width;

        // total radius in view coords
        var sumRadius = modelViewTransform.modelToViewDeltaX( model.object1.radiusProperty.get() ) +
                        modelViewTransform.modelToViewDeltaX( model.object2.radiusProperty.get() );

        // limit the drag bounds by the position of the other object - object 1 must be to the left of object 2
        if ( objectModel.positionProperty.get() === model.object1.positionProperty.get() ) {
          xMax = modelViewTransform.modelToViewX( model.object2.positionProperty.get() ) - sumRadius -
                 modelViewTransform.modelToViewDeltaX( InverseSquareLawCommonConstants.MIN_SEPARATION_BETWEEN_OBJECTS );
        }
        if ( objectModel.positionProperty.get() === model.object2.positionProperty.get() ) {
          xMin = modelViewTransform.modelToViewX( model.object1.positionProperty.get() ) + sumRadius +
                 modelViewTransform.modelToViewDeltaX( InverseSquareLawCommonConstants.MIN_SEPARATION_BETWEEN_OBJECTS );
        }

        // apply limitations and update position
        x = Math.max( Math.min( x, xMax ), xMin ); // limited value of x (by boundary) in view coords

        // snap to nearest snapToNearest if specified
        if ( options.snapToNearest ) {

          // x in model coordinates
          var xModel = modelViewTransform.viewToModelX( x );
          var snappedX = Util.roundSymmetric( xModel / options.snapToNearest ) * options.snapToNearest;

          // back to view coordinates
          x = modelViewTransform.modelToViewX( snappedX );
        }

        objectModel.positionProperty.set( Util.toFixedNumber( modelViewTransform.viewToModelX( x ), 3 ) );
      },
      tandem: tandem.createTandem( 'objectDragHandler' )
    } ) );

  }

  inverseSquareLawCommon.register( 'ObjectNode', ObjectNode );

  return inherit( Node, ObjectNode, {

    updateGradient: function() {
      throw new Error( 'Update gradient must be implemented in subtypes.' );
    }
  } );

} );
