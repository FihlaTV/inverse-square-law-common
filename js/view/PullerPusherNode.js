// Copyright 2013-2015, University of Colorado Boulder

/**
 * puller view for massObject
 *
 * @author Anton Ulyanov (Mlearner)
 */
define( function( require ) {
  'use strict';

  // modules
  var Image = require( 'SCENERY/nodes/Image' );
  var inherit = require( 'PHET_CORE/inherit' );
  var inverseSquareLawCommon = require( 'INVERSE_SQUARE_LAW_COMMON/inverseSquareLawCommon' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Shape = require( 'KITE/Shape' );
  var Path = require( 'SCENERY/nodes/Path' );
  var Vector2 = require( 'DOT/Vector2' );

  // images
  var pullImage0 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_0.png' );
  var pullImage1 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_1.png' );
  var pullImage2 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_2.png' );
  var pullImage3 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_3.png' );
  var pullImage4 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_4.png' );
  var pullImage5 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_5.png' );
  var pullImage6 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_6.png' );
  var pullImage7 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_7.png' );
  var pullImage8 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_8.png' );
  var pullImage9 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_9.png' );
  var pullImage10 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_10.png' );
  var pullImage11 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_11.png' );
  var pullImage12 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_12.png' );
  var pullImage13 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_13.png' );
  var pullImage14 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  //puhsers - TODO: replace with proper image paths
  var pullImage15 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage16 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage17 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage18 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage19 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage20 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage21 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage22 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage23 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage24 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage25 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage26 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage27 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );
  var pullImage28 = require( 'image!GRAVITY_FORCE_LAB/pull_figure_14.png' );



  // TODO: add additional images for pushers
  // imaages 15 - 28 will are inserted from most pushy to least with image 0 being neutral
  var pullImages = [ pullImage15, pullImage16, pullImage17, pullImage18, pullImage19, pullImage20, 
    pullImage21, pullImage22, pullImage23, pullImage24, pullImage25, pullImage26, pullImage27, pullImage28, 
    pullImage0, pullImage1, pullImage2, pullImage3, pullImage4, pullImage5, pullImage6, pullImage7, 
    pullImage8, pullImage9, pullImage10, pullImage11, pullImage12, pullImage13, pullImage14 ];

  // TODO: add ability to handle negative values

  /**
   * @param {Tandem} tandem
   * @param {Object} [options]
   * @constructor
   */
  function PullerPusherNode( tandem, options ) {
    options = _.extend( { ropeLength: 50 }, options );
    Node.call( this, { tandem: tandem } );

    var pullerGroupNode = new Node( {
      x: -options.ropeLength,
      tandem: tandem.createTandem( 'pullerGroupNode' )
    } );
    var images = [];
    var i;
    var pullerNodeGroupTandem = tandem.createGroupTandem( 'node' );
    for ( i = 0; i < pullImages.length; i++ ) {
      var pullerTandem = pullerNodeGroupTandem.createNextTandem();
      var image = new Image( pullImages[ i ], { tandem: pullerTandem.createTandem( 'image' ) } );
      images.push( new Node( {
        children: [ new Path( Shape.circle( 0, 0, 10 ), {
          fill: '#777',
          scale: new Vector2( image.width / 20, 1 ),
          x: image.width / 2,
          y: image.height - 5,
          tandem: pullerTandem.createTandem( 'shadowNode' )
        } ), image ],
        tandem: pullerTandem
      } ) );
    }
    pullerGroupNode.addChild( new Path( Shape.lineSegment( -options.ropeLength, 0, 0, 0 ), {
      stroke: '#666',
      lineWidth: 2,
      tandem: tandem.createTandem( 'ropeNode' )
    } ) );
    for ( i = 0; i < pullImages.length; i++ ) {
      pullerGroupNode.addChild( images[ i ] );
      images[ i ].scale( -0.3, 0.3 );
      images[ i ].bottom = 33;
      images[ i ].right = i - options.ropeLength;
      images[ i ].setVisible( false );
    }

    this.addChild( pullerGroupNode );
    //function select image
    this.setPull = function( force, offsetX ) {
      // manipulate force to properly index into the image array
      for ( var i = 0; i < pullImages.length; i++ ) {
        images[ i ].setVisible( i === force );
      }
      pullerGroupNode.x = -offsetX;
    };
  }

  inverseSquareLawCommon.register( 'PullerPusherNode', PullerPusherNode );

  return inherit( Node, PullerPusherNode );
} );
