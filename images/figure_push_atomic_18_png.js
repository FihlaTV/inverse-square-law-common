/* eslint-disable */
var img = new Image();
window.phetImages.push( img );
img.src = 'data:image/png;base64,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';
export default img;