// Copyright 2017, University of Colorado Boulder

/**
 * control that allows the user to show or hide the force values
 *
 * @author Michael Barlow (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var inverseSquareLawCommon = require( 'INVERSE_SQUARE_LAW_COMMON/inverseSquareLawCommon' );
  var Panel = require( 'SUN/Panel' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var Text = require( 'SCENERY/nodes/Text' );
  var VerticalCheckBoxGroup = require( 'SUN/VerticalCheckBoxGroup' );

  // constants
  var TEXT_MAX_WIDTH = 120;

  /**
   * @param {Object[]} items - list of item objects to attach
   * @param {Tandem} tandem
   * @param {Object} [options]
   * @constructor
   */
  function ISLCCheckboxPanel( items, tandem, options ) {

    options = _.extend( {
      fill: '#FDF498',
      xMargin: 10,
      yMargin: 10,
      minWidth: 170,
      align: 'left',
      textSize: 14,
      itemTextMaxWidth: TEXT_MAX_WIDTH,
      tandem: tandem
    }, options );

    var verticalCheckBoxItems = [];

    // the check boxes in the group will be as wide as the labels are tall
    var checkBoxWidth = 0;

    items.forEach( function( item ) {
      var itemLabel = new Text(
        item.content, {
          tandem: tandem.createTandem( item.textTandemLabel ),
          font: new PhetFont( options.textSize ),
          maxWidth: options.itemTextMaxWidth
        }
      );

      checkBoxWidth = Math.max( checkBoxWidth, itemLabel.height );

      verticalCheckBoxItems.push( {
        content: itemLabel,
        property: item.property,
        tandemName: item.checkboxTandemLabel
      } );
    } );
    assert && assert( checkBoxWidth !== 0, 'checkBox width should not be zero.' );

    var checkboxGroup = new VerticalCheckBoxGroup( verticalCheckBoxItems, {
      boxWidth: checkBoxWidth
    } );

    Panel.call( this, checkboxGroup, options );
  }

  inverseSquareLawCommon.register( 'ISLCCheckboxPanel', ISLCCheckboxPanel );

  return inherit( Panel, ISLCCheckboxPanel );
} );