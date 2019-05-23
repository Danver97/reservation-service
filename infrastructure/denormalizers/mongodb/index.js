const handlerFunc = require('./handler');
const writerFunc = require('./writer');

exports.mongoDenormalizer = function(event, context, callback) {
    callback(null, "some success message");
   // or 
   // callback("some error type"); 
}