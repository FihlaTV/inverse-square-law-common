// Copyright 2017-2018, University of Colorado Boulder

/**
 * Common type for model items in inverse square law sims.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var DerivedProperty = require( 'AXON/DerivedProperty' );
  var DerivedPropertyIO = require( 'AXON/DerivedPropertyIO' );
  var Emitter = require( 'AXON/Emitter' );
  var inherit = require( 'PHET_CORE/inherit' );
  var inverseSquareLawCommon = require( 'INVERSE_SQUARE_LAW_COMMON/inverseSquareLawCommon' );
  var ISLCConstants = require( 'INVERSE_SQUARE_LAW_COMMON/ISLCConstants' );
  var NumberIO = require( 'TANDEM/types/NumberIO' );
  var NumberProperty = require( 'AXON/NumberProperty' );
  var Property = require( 'AXON/Property' );
  var PropertyIO = require( 'AXON/PropertyIO' );
  var Range = require( 'DOT/Range' );
  var RangeIO = require( 'DOT/RangeIO' );

  /**
   * @param {number} initialMass
   * @param {Vector2} initialPosition
   * @param {Range} valueRange
   * @param {Property.<boolean>} constantRadiusProperty
   * @param {Tandem} tandem
   * @param {Object} [options]
   * @constructor
   */
  function ISLCObject( initialMass, initialPosition, valueRange, constantRadiusProperty, tandem, options ) {

    var self = this;

    options = _.extend( {

      // in meters
      leftObjectBoundary: ISLCConstants.LEFT_OBJECT_BOUNDARY,
      rightObjectBoundary: ISLCConstants.RIGHT_OBJECT_BOUNDARY,

      tandemUnits: 'kilograms' // TODO: this is not used
    }, options );

    // @public
    this.positionProperty = new NumberProperty( initialPosition, {
      tandem: tandem.createTandem( 'positionProperty' ),
      units: 'meters',
      range: new Range( options.leftObjectBoundary, options.rightObjectBoundary )
    } );

    // @public {Property.<number>} - the mass or charge of the object in kilograms or coulombs
    this.valueProperty = new NumberProperty( initialMass, {
      tandem: tandem.createTandem( 'valueProperty' ),
      range: valueRange
    } );

    // @public {Property.<number>} - the radius of the mass or charge in meters
    // since ISLCObjects are never destroyed, no need to dispose
    this.radiusProperty = new DerivedProperty( [ this.valueProperty, constantRadiusProperty ],
      function( valueProperty, constantRadius ) {
        return constantRadius ? options.constantRadius : self.calculateRadius( valueProperty );
      }, {
        tandem: tandem.createTandem( 'radiusProperty' ),
        units: 'meters',
        phetioType: DerivedPropertyIO( NumberIO )
      }
    );

    var enabledRange = new Range( options.leftObjectBoundary, options.rightObjectBoundary );

    // @public {Property.<Range>}- set by ISLCModel when the force changes
    this.enabledRangeProperty = new Property( enabledRange, {
      tandem: tandem.createTandem( 'enabledRangeProperty' ),
      phetioType: PropertyIO( RangeIO )
    } );

    // @publiv (read-only) - Emitter that fires whenever the position changes as a result of an object's value changing
    this.valueChangedPositionEmitter = new Emitter();

    // @public - flag to check if the object is being dragged by the user
    //           set in the drag handler
    this.isDragging = false;

    // @public - flag to check whether object's radius was updated, used to determine positioning
    this.radiusLastChanged = false;

    // @public
    this.valueRange = valueRange;
  }

  inverseSquareLawCommon.register( 'ISLCObject', ISLCObject );

  return inherit( Object, ISLCObject, {

    /**
     * Calculate radius for the object - must be implemented in subtypes.
     *
     * @public
     * @abstract
     */
    calculateRadius: function() {
      assert && assert( false, 'calculateRadius must be implemented in descendent types' );
    },

    /**
     * Resets object model properties.
     *
     * @public
     */
    reset: function() {
      this.valueProperty.reset();
      this.positionProperty.reset();
    }
  } );
} );