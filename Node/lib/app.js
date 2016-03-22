var util = require('./util.js');
var errors = require('../config/errors.js');

var onshape = require('./onshape.js');

var getParts = function (documentId, wvm, wvmId, elementId, cb) {
  var opts = {
    d: documentId,
    e: elementId,
    resource: 'parts'
  };
  opts[wvm] = wvmId;
  onshape.get(opts, cb);
}

var getMassProperties = function (documentId, wvm, wvmId, elementId, cb) {
  var opts = {
    d: documentId,
    e: elementId,
    resource: 'partstudios',
    subresource: 'massproperties',
    query: {
      massAsGroup: false
    }
  }
  opts[wvm] = wvmId;
  onshape.get(opts, cb);
}

module.exports = function (documentId, wvm, wvmId, elementId) {
  var partsByMaterial = {};
  var massByMaterial = {};

  var getPartsStep = function () {
    getParts(documentId, wvm, wvmId, elementId, function (data) {
      var partsList = JSON.parse(data.toString()); // it's a JSON array
      for (var i = 0; i < partsList.length; i++) {
        if (partsList[i]['material'] === undefined) {
          continue;
        }
        if (!(partsList[i]['material']['id'] in partsByMaterial)) {
          partsByMaterial[partsList[i]['material']['id']] = [];
        }
        partsByMaterial[partsList[i]['material']['id']].push(partsList[i]['partId']);
      }
      getMassPropertiesStep();
    });
  };

  var getMassPropertiesStep = function () {
    getMassProperties(documentId, wvm, wvmId, elementId, function (data) {
      var massList = JSON.parse(data.toString());
      for (var material in partsByMaterial) {
        massByMaterial[material] = 0;
        for (var i = 0; i < partsByMaterial[material].length; i++) {
          if (massList.bodies[partsByMaterial[material][i]]['hasMass']) {
            massByMaterial[material] += massList.bodies[partsByMaterial[material][i]]['mass'][0];
          }
        }
        console.log(material + ': ' + massByMaterial[material]);
      }
    });
  };

  getPartsStep();
};