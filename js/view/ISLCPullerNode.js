// Copyright 2017-2018, University of Colorado Boulder

/**
 * The pullers attached to the mass and charge objects. The node maintains a list of puller images that vary in
 * perceived pull effort. They are made visible and invisible to correspond to a given force value.
 *
 * @author Michael Barlow (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var Bounds2 = require( 'DOT/Bounds2' );
  var Circle = require( 'SCENERY/nodes/Circle' );
  var Image = require( 'SCENERY/nodes/Image' );
  var inherit = require( 'PHET_CORE/inherit' );
  var inverseSquareLawCommon = require( 'INVERSE_SQUARE_LAW_COMMON/inverseSquareLawCommon' );
  var ISLCPullerImages = require( 'INVERSE_SQUARE_LAW_COMMON/ISLCPullerImages' );
  var LinearFunction = require( 'DOT/LinearFunction' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Path = require( 'SCENERY/nodes/Path' );
  var Shape = require( 'KITE/Shape' );
  var Util = require( 'DOT/Util' );
  var Vector2 = require( 'DOT/Vector2' );

  // constants
  var IMAGE_SCALE = 0.45;

  /**
   * @param {RangeWithValue} forceRange - range of forces, used for determining the visible pullImage
   * @param {Tandem} tandem
   * @param {Object} [options]
   * @constructor
   */
  function ISLCPullerNode( forceRange, tandem, options ) {

    options = _.extend( {
      ropeLength: 50,
      shadowMinWidth: 32,
      shadowMaxWidth: 50,
      attractNegative: true, // if true, add pusher images
      displayShadow: true,
      atomicScale: false
    }, options );

    Node.call( this, { tandem: tandem } );

    var pullImages = ISLCPullerImages.pullImages;
    var pushImages = ISLCPullerImages.pushImages;
    var zeroForceImage = ISLCPullerImages.zeroForceImage;

    // set atomic pullers if on the atomic screen
    if ( options.atomicScale ) {
      pullImages = ISLCPullerImages.atomicPullImages;
      pushImages = ISLCPullerImages.atomicPushImages;
      zeroForceImage = ISLCPullerImages.atomicZeroForceImage;
    }

    // @private
    this.pullerPusherImages = pullImages;

    // @public
    this.touchAreaBounds = new Bounds2( 0,0,0,0 );

    // used to ensure that small non-zero forces do not map to the zero force puller (see lines 130-132)
    var zeroForceIndex = null;

    // if in coulomb's law, add pusher and zero force images in proper order
    if ( options.attractNegative ) {
      zeroForceIndex = pushImages.length;
      this.pullerPusherImages = pushImages.concat( zeroForceImage ).concat( pullImages );
    }

    // function that maps the visible image to the model force value
    var forceToImage = new LinearFunction( forceRange.min, forceRange.max, 0, this.pullerPusherImages.length - 1, true );

    // function to dynamically move the position of the shadow under the puller
    var indexToShadowOffset = new LinearFunction( 0, this.pullerPusherImages.length - 1, -4, 6 );

    // function that maps the size of the shadow to the force value
    var forceToShadowWidth = new LinearFunction( forceRange.min, forceRange.max, options.shadowMinWidth, options.shadowMaxWidth, true );

    // parent node for all puller images and the rope
    var pullerGroupNode = new Node();

    // the optional shadow node under the pullers - a circle scaled down vertically to look elliptical
    var shadowNode = new Circle( 10, {
      fill: '#777',
      scale: new Vector2( 1, 0.20 )
    } );

    // create each of the puller/pusher image nodes
    var images = [];
    var i;
    for ( i = 0; i < this.pullerPusherImages.length; i++ ) {
      var pullerImage = new Image( this.pullerPusherImages[ i ] );

      // puller images are much larger than pushers, so we need to scale it down
      pullerImage.scale( IMAGE_SCALE, IMAGE_SCALE );

      images.push( pullerImage );
    }

    pullerGroupNode.addChild( new Path( Shape.lineSegment( -options.ropeLength, 0, 0, 0 ), {
      stroke: '#666',
      lineWidth: 2
    } ) );

    // set the layout for the images
    for ( i = 0; i < this.pullerPusherImages.length; i++ ) {
      pullerGroupNode.addChild( images[ i ] );
      images[ i ].bottom = 42;
      images[ i ].right = -options.ropeLength;
      images[ i ].setVisible( false );

      // the pullImages grow in width as they animate, but their hands stay in the same position, so make sure that
      // they are still grabbing the rope
      images[ i ].right += 0.1 * images[ i ].width;
    }

    // shadow first so it is behind the pullers
    options.displayShadow && this.addChild( shadowNode );
    this.addChild( pullerGroupNode );
    var self = this;
    // @public - set the visibility of the image corresponding to the current force value
    this.setPull = function( force, offsetX ) {

      if ( options.attractNegative ) {
        force *= -1;
      }

      // from the force value, get an index for the visible image
      var index = Util.roundSymmetric( forceToImage( force ) );

      if ( force !== 0 && index === zeroForceIndex ) {
        index += ( force > 0 ) ? 1 : -1;
      }

      for ( var i = 0; i < this.pullerPusherImages.length; i++ ) {
        images[ i ].setVisible( i === index );
      }
      pullerGroupNode.x = -offsetX;

      // scale the shadow and place it under the visible image
      shadowNode.radius = forceToShadowWidth( force ) / 2;
      shadowNode.right = images[ index ].right - offsetX + Util.roundSymmetric( indexToShadowOffset( index ) );
      shadowNode.centerY = images[ index ].bottom;

      // configure pointer area
      // NOTE: the rope is not included in the draggable node, so we expose the puller bounds here for setting
      // the touch and mouse areas in ISLCObjectNode
      self.touchAreaBounds = pullerGroupNode.bounds.withOffsets( 0, 0, -options.ropeLength + 5, 2 );
    };
  }

  inverseSquareLawCommon.register( 'ISLCPullerNode', ISLCPullerNode );

  return inherit( Node, ISLCPullerNode );
} );