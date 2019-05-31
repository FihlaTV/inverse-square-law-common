// Copyright 2017-2018, University of Colorado Boulder

/**
 * Main model for a system of two objects that exert forces on each other.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var BooleanProperty = require( 'AXON/BooleanProperty' );
  var DerivedProperty = require( 'AXON/DerivedProperty' );
  var DerivedPropertyIO = require( 'AXON/DerivedPropertyIO' );
  var Emitter = require( 'AXON/Emitter' );
  var inherit = require( 'PHET_CORE/inherit' );
  var inverseSquareLawCommon = require( 'INVERSE_SQUARE_LAW_COMMON/inverseSquareLawCommon' );
  var ISLCObjectEnum = require( 'INVERSE_SQUARE_LAW_COMMON/view/ISLCObjectEnum' );
  var NumberIO = require( 'TANDEM/types/NumberIO' );
  var Property = require( 'AXON/Property' );
  var Range = require( 'DOT/Range' );
  var Util = require( 'DOT/Util' );

  /**
   * @param {number} forceConstant the appropriate force constant (e.g. G or k)
   * @param {ISLCObject} object1 - the first Mass or Charge object
   * @param {ISLCObject} object2 - the second Mass or Charge object
   * @param {Range} locationRange- in meters, location range for the objects, min is the left bouncary for left object,
   *                              and the same for max/right
   * @param {Tandem} tandem
   * @param {Object} [options]
   * @constructor
   */
  function ISLCModel( forceConstant, object1, object2, locationRange, tandem, options ) {

    var self = this;

    options = _.extend( {
      snapObjectsToNearest: null, // {number|null} if defined, objects will snap to nearest value in model coordinates
      minSeparationBetweenObjects: 0.1 // in meters
    }, options );

    // @public (read-only)
    this.leftObjectBoundary = locationRange.min;
    this.rightObjectBoundary = locationRange.max;

    // @public {Property.<boolean>}- whether to display the force values
    this.forceValuesProperty = new BooleanProperty( true, {
      tandem: tandem.createTandem( 'forceValuesProperty' )
    } );

    // @public
    this.object1 = object1;
    this.object2 = object2;

    // @public
    // {Property.<ISLCObjectEnum|null>} - needed for adjusting alerts when an object moves as a result of a radius increase
    this.pushedObjectEnumProperty = new Property( null );

    // @private
    this.snapObjectsToNearest = options.snapObjectsToNearest;

    // @private
    this.minSeparationBetweenObjects = options.minSeparationBetweenObjects;

    // @private
    this.forceConstant = forceConstant;

    // @public - emits an event when the model is updated by step
    this.stepEmitter = new Emitter();

    // @public {Property.<number>} - calculates the force based on changes to values and positions
    // objects are never destroyed, so forceProperty does not require disposal
    this.forceProperty = new DerivedProperty( [
      this.object1.valueProperty, // see valueProperty in ISLCObject.js
      this.object2.valueProperty,
      this.object1.positionProperty,
      this.object2.positionProperty
    ], function( v1, v2, x1, x2 ) {
      var distance = Math.abs( x2 - x1 );
      return self.calculateForce( v1, v2, distance );
    }, {
      phetioType: DerivedPropertyIO( NumberIO ),
      tandem: tandem.createTandem( 'forceProperty' ),
      units: 'newtons',
      phetioDocumentation: 'The force of one object on the other (in Newtons)'
    } );

    var updateRange = function( object ) {
      var maxPosition = self.getObjectMaxPosition( object );
      var minPosition = self.getObjectMinPosition( object );

      object.enabledRangeProperty.set( new Range( minPosition, maxPosition ) );
    };

    // a11y - necessary to reset the enabledRangeProperty to prevent object overlap, disposal not necessary
    // We need to update the available range for each object when the either's radius or position changes.
    Property.multilink( [ object1.positionProperty, object2.positionProperty ], function() {
      updateRange( object1 );
      updateRange( object2 );
    } );

    // when sim is reset, we only reset the position properties of each object to their initial values
    // thus, there is no need to dispose of the listeners below
    this.object1.radiusProperty.link( function() {
      self.object1.radiusLastChanged = true;
      self.object2.radiusLastChanged = false;

      // update range if radius changed with "constant radius" setting (which didn't trigger other model updates)
      updateRange( object1 );
      updateRange( object2 );
    } );

    this.object2.radiusProperty.link( function() {
      self.object2.radiusLastChanged = true;
      self.object1.radiusLastChanged = false;

      // update range if radius changed with "constant radius" setting (which didn't trigger other model updates)
      updateRange( object2 );
      updateRange( object1 );
    } );

    // wire up logic to update the state of the pushedObjectEnumProperty
    const createPushedPositionListener = objectEnum => {
      return () => {
        if ( this.object1.isDragging || this.object2.isDragging ) {
          this.pushedObjectEnumProperty.value = null;
        }
        else {

          // This conditional should only be hit if the mass has changed in addition to the position. Since the object's
          // valueProperty would be set in the previous frame, and then this frame's step function would update the
          // position. This was understood to be the truth by @zepumph while working on https://github.com/phetsims/gravity-force-lab-basics/issues/132
          this.pushedObjectEnumProperty.value = objectEnum;
        }
      };
    };

    // lazy link so we don't have a strange initial condition even though we haven't moved the pushers.
    object1.positionProperty.lazyLink( createPushedPositionListener( ISLCObjectEnum.OBJECT_ONE ) );
    object2.positionProperty.lazyLink( createPushedPositionListener( ISLCObjectEnum.OBJECT_TWO ) );

    // when the mass is lessened, there is no way that pushed an object, so set to null
    const massChangedListener = ( newMass, oldMass ) => {
      if ( oldMass > newMass ) {
        this.pushedObjectEnumProperty.value = null;
      }
    };
    object1.valueProperty.link( massChangedListener );
    object2.valueProperty.link( massChangedListener );
  }

  inverseSquareLawCommon.register( 'ISLCModel', ISLCModel );

  return inherit( Object, ISLCModel, {

    /**
     * Step function makes sure objects don't go out of bounds and don't overlap each other at each time step.
     *
     * @public
     */
    step: function() {
      var minX = this.leftObjectBoundary;
      var maxX = this.rightObjectBoundary;

      var locationObject1 = this.object1.positionProperty.get();
      var locationObject2 = this.object2.positionProperty.get();

      // bounds for the left object are the left boundary and the right edge of object 2 minus half the min separation
      var minPositionObject1 = minX;
      var maxPositionObject1 = this.getObjectMaxPosition( this.object1 );

      // bounds for the right object are the right edge of object 1 plus half the separation distance and the right edge
      var minPositionObject2 = this.getObjectMinPosition( this.object2 );
      var maxPositionObject2 = maxX;

      // make sure that the objects don't go beyond the boundaries
      locationObject1 = Math.max( minPositionObject1, locationObject1 );
      locationObject2 = Math.min( locationObject2, maxPositionObject2 );

      // make sure objects don't overlap
      locationObject1 = Math.min( locationObject1, maxPositionObject1 );
      locationObject2 = Math.max( minPositionObject2, locationObject2 );

      // if objects are limited to a certain precision, round position values to that precision
      locationObject1 = this.snapToGrid( locationObject1 );
      locationObject2 = this.snapToGrid( locationObject2 );

      if ( this.object1.isDragging ) {
        this.object1.positionProperty.set( locationObject1 );
      }
      else if ( this.object2.isDragging ) {
        this.object2.positionProperty.set( locationObject2 );
      }
      else {

        // neither object is dragging, radius must have changed
        if ( this.object1.radiusLastChanged ) {
          if ( this.object2.positionProperty.get() < maxX ) {

            // only set if it is different
            if ( locationObject2 !== this.object2.positionProperty.get() ) {

              // object2 is not at the edge update its position
              this.object2.positionProperty.set( locationObject2 );
              this.object2.valueChangedPositionEmitter.emit();
            }
          }
          else {

            // only set if it is different
            if ( locationObject1 !== this.object1.positionProperty.get() ) {

              // object2 is at the edge update object1 position
              this.object1.positionProperty.set( locationObject1 );
              this.object1.valueChangedPositionEmitter.emit();
            }
          }
        }
        else if ( this.object2.radiusLastChanged ) {
          if ( this.object1.positionProperty.get() > minX ) {

            // only set if it is different
            if ( locationObject1 !== this.object1.positionProperty.get() ) {

              // object1 is not at boundary, update position
              this.object1.positionProperty.set( locationObject1 );
              this.object1.valueChangedPositionEmitter.emit();
            }
          }
          else {

            // only set if it is different
            if ( locationObject2 !== this.object2.positionProperty.get() ) {

              this.object2.positionProperty.set( locationObject2 );
              this.object2.valueChangedPositionEmitter.emit();
            }
          }
        }
      }

      // broadcast a message that we have updated the model
      this.stepEmitter.emit();
    },

    /**
     * Helper function to for accessing and mapping force ranges in the inheriting sims' views
     *
     * Note: this function assumes that the ranges of both objects' values are the same
     *
     * @public
     * @returns {number} the smallest possible force magnitude
     */
    getMinForce: function() {
      var maxDistance = Math.abs( this.rightObjectBoundary - this.leftObjectBoundary );

      // Since we're checking for magnitude, negative values for charges will need
      // to be set to zero.
      var minValue = this.object1.valueRange.min < 0 ? 0 : this.object1.valueRange.min;

      // ensure we always return a positive force value or zero
      return Math.abs( this.calculateForce( minValue, minValue, maxDistance ) );
    },

    /**
     * Helper function to for accessing and mapping force ranges in the inheriting sims' views
     *
     * Note: this function assumes that the ranges of both objects' values are the same
     *
     * @public
     * @returns {number} the largest possible force magnitude
     */
    getMaxForce: function() {
      var maxValue = this.object1.valueRange.max;
      return Math.abs( this.calculateForce( maxValue, maxValue, this.getMinDistance( maxValue ) ) );
    },

    /**
     * Get the minimum possible separation between the objects' centers given a defined value for each of their
     * main properties.
     *
     * @public
     * @param  {number} value - the object's mass or charge
     * @returns {number} the distance between the objects' centers
     */
    getMinDistance: function( value ) {

      // calculate radius for masses and charges at maximum mass/charge
      var minRadius = this.object1.calculateRadius( value );
      return ( 2 * minRadius ) + this.minSeparationBetweenObjects;
    },

    /**
     * Helper function to calculate the force within the model
     *
     * @public
     * @param  {number} v1 - the first object's mass or charge
     * @param  {number} v2 - the second object's mass or charge
     * @param  {number} distance - the distance between the objects' centers
     * @returns {number} the force between the two objects
     */
    calculateForce: function( v1, v2, distance ) {
      assert && assert( distance > 0, 'must have non zero distance between objects' );
      return this.forceConstant * v1 * v2 / ( distance * distance );
    },

    /**
     * Returns the sum of the radii of the two spherical objects in this sim, plus the model's min separation between
     * the two objects.  This is used throughout the model.
     *
     * @public
     * @returns {number}
     */
    getSumRadiusWithSeparation: function() {
      return this.snapToGrid(
        this.object1.radiusProperty.get() + this.object2.radiusProperty.get() + this.minSeparationBetweenObjects
      );
    },

    /**
     * Get the absolute maximum horizontal position for an object, relative to the object's center.
     *
     * @private
     * @param  {ISLCObject} object
     * @returns {number}
     */
    getObjectMaxPosition: function( object ) {

      var sumRadius = this.getSumRadiusWithSeparation();
      var maxX;
      if ( object === this.object1 ) {

        // the max value for the left object is the position of the right object minius the sum of radii
        maxX = this.object2.positionProperty.get() - sumRadius;
      }
      else if ( object === this.object2 ) {

        // the max value for the right object is the right edge minus the puller width and the radius of the object
        maxX = this.rightObjectBoundary;
      }

      return this.snapToGrid( maxX );
    },

    /**
     * Get the absolute minimum horizontal position for an object.
     *
     * @private
     * @param  {ISLCObject} object
     * @returns {number}
     */
    getObjectMinPosition: function( object ) {

      var sumRadius = this.getSumRadiusWithSeparation();
      var minX;
      if ( object === this.object1 ) {

        // the min value for the left object is the left edge plus the puller width and the radius of the object
        minX = this.leftObjectBoundary;
      }
      else if ( object === this.object2 ) {

        // min value for the right object is the position of the left object plus the sum of radii between the two
        // object plus the min distance
        minX = this.object1.positionProperty.get() + sumRadius;
      }

      return this.snapToGrid( minX );
    },

    /**
     * Get whether or not the position of a mass was most recently changed based on the other pushing it.
     * @returns {boolean}
     */
    massWasPushed: function() {
      return this.pushedObjectEnumProperty.value !== null;
    },

    /**
     * If this model constrains the objects to a grid, this snaps the position to the nearest spot in the grid.
     *
     * @private
     * @param  {number} position
     * @returns {number}
     */
    snapToGrid: function( position ) {
      var snappedPosition = position;
      var numDecimalPlaces = Util.numberOfDecimalPlaces( this.snapObjectsToNearest );
      if ( this.snapObjectsToNearest ) {
        snappedPosition = Util.roundSymmetric( position / this.snapObjectsToNearest ) * this.snapObjectsToNearest;
        snappedPosition = Util.toFixedNumber( snappedPosition, numDecimalPlaces );
      }

      // now make sure that the snapped position is within the left and right boundaries for this model
      snappedPosition = Math.min( snappedPosition, this.rightObjectBoundary );
      snappedPosition = Math.max( snappedPosition, this.leftObjectBoundary );
      return snappedPosition;
    },

    // @public
    reset: function() {
      this.forceValuesProperty.reset();

      // if the position of object2 is equal to object1's initial position, an error will result when we
      // reset object1's position. Thus, we need to check for that one edge case prior to reset
      if ( this.object2.positionProperty.get() === this.object1.positionProperty.initialValue ) {
        this.object2.reset();
        this.object1.reset();
      }
      else {
        this.object1.reset();
        this.object2.reset();
      }

      // This needs to be reset after the objects, see https://github.com/phetsims/gravity-force-lab-basics/issues/132
      this.pushedObjectEnumProperty.reset();
    }
  } );
} );