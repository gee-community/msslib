/**
 * @license
 * Copyright 2020 Justin Braaten
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #############################################################################
// ### VERSION ###
// #############################################################################

exports.version = '0.1.1';

// #############################################################################
// ### CONSTANTS ###
// #############################################################################

/**
 * A dictionary of false color visualization parameters for MSS DN images.
 *
 * @constant {Object}
 * @example
 * // Get an MSS image.
 * var mssDnImg = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   yearRange: [1987, 1987],
 *   doyRange: [170, 240],
 *   wrs: '2'
 * }).first();
 * 
 * // Use with Map.addLayer().
 * Map.centerObject(mssDnImg, 8);
 * Map.addLayer(mssDnImg, msslib.visDn, 'From Map.addLayer()');
 * 
 * // Use with ee.Image.visualize().
 * var visImg = mssDnImg.visualize(msslib.visDn);
 * Map.addLayer(visImg, null, 'From ee.Image.visualize()');
 */
var visDn = {
  bands: ['nir', 'red', 'green'], 
  min: [47, 20, 27],
  max: [142, 92, 71],
  gamma: [1.2, 1.2, 1.2]
};
exports.visDn = visDn;

/**
 * A dictionary of false color visualization parameters for MSS radiance images.
 *
 * @constant {Object}
 * @example
 * // Get an MSS image.
 * var mssDnImg = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   yearRange: [1987, 1987],
 *   doyRange: [170, 240],
 *   wrs: '2'
 * }).first();
 * 
 * // Convert DN to radiance.
 * var mssRadImg = msslib.calcRad(mssDnImg);
 * 
 * // Use with Map.addLayer().
 * Map.centerObject(mssRadImg, 8);
 * Map.addLayer(mssRadImg, msslib.visRad, 'From Map.addLayer()');
 * 
 * // Use with ee.Image.visualize().
 * var visImg = mssRadImg.visualize(msslib.visRad);
 * Map.addLayer(visImg, null, 'From ee.Image.visualize()');
 */
var visRad = {
  bands: ['nir', 'red', 'green'],
  min: [23, 15, 25],
  max: [67, 62, 64],
  gamma: [1.2, 1.2, 1.2]
};
exports.visRad = visRad;

/**
 * A dictionary of false color visualization parameters for MSS TOA reflectance
 * images.
 *
 * @constant {Object}
 * @example
 * // Get an MSS image.
 * var mssDnImg = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   yearRange: [1987, 1987],
 *   doyRange: [170, 240],
 *   wrs: '2'
 * }).first();
 * 
 * // Convert DN to TOA.
 * var mssToaImg = msslib.calcToa(mssDnImg);
 * 
 * // Use with Map.addLayer().
 * Map.centerObject(mssToaImg, 8);
 * Map.addLayer(mssToaImg, msslib.visToa, 'From Map.addLayer()');
 * 
 * // Use with ee.Image.visualize().
 * var visImg = mssToaImg.visualize(msslib.visToa);
 * Map.addLayer(visImg, null, 'From ee.Image.visualize()');
 */
var visToa = {
  bands: ['nir', 'red', 'green'],
  min: [0.0896, 0.0322, 0.0464],
  max: [0.2627, 0.1335, 0.1177],
  gamma: [1.2, 1.2, 1.2]
};
exports.visToa = visToa;

/**
 * A dictionary of visualization parameters for MSS NDVI images.
 *
 * @constant {Object}
 * @example
 * // Get an MSS image.
 * var mssDnImg = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   yearRange: [1987, 1987],
 *   doyRange: [170, 240],
 *   wrs: '2'
 * }).first();
 * 
 * // Convert DN to TOA and add NDVI band.
 * var mssNdviImg = msslib.addNdvi(msslib.calcToa(mssDnImg));
 * 
 * // Use with Map.addLayer().
 * Map.centerObject(mssNdviImg, 8);
 * Map.addLayer(mssNdviImg, msslib.visNdvi, 'From Map.addLayer()');
 * 
 * // Use with ee.Image.visualize().
 * var visImg = mssNdviImg.visualize(msslib.visNdvi);
 * Map.addLayer(visImg, null, 'From ee.Image.visualize()');
 */
var visNdvi = {
  bands: ['ndvi'], min: 0.1, max: 0.8
};
exports.visNdvi = visNdvi;

/**
 * An example MSS 5 image.
 *
 * @constant {ee.Image}
 * @ignore
 */
var exMss5 = ee.Image('LANDSAT/LM05/C01/T2/LM05_045029_19840728');
exports.exMss5 = exMss5;

// #############################################################################
// ### FETCH COLLECTIONS ###
// #############################################################################

/**
 * Generates the PPPRRR path/row granuale ID.
 * 
 * @param {ee.Image} img A Landsat MSS image.
 * @returns {ee.String} A Landsat PPPRRR path/row granuale ID.
 * @ignore
 */
function getPr(img) {
    var path = ee.String('000').cat(
            ee.String(ee.Number(img.get('WRS_PATH')).toShort())).slice(-3);
    var row = ee.String('000').cat(
            ee.String(ee.Number(img.get('WRS_ROW')).toShort())).slice(-3);
    return ee.String(path.cat(row));
}

// TODO: describe the returned dictionary better, it may not be clear what the
// keys and values are. Also, why not add the 40 km buffer as needed later,
// seems strange to include it here.

/**
 * Get the geometry for a given WRS-1 granule. Returns a dictionary with three
 * elements: 'granule' a `ee.Feature`, granule 'centroid' a `ee.Geometry`, and
 * granule 'bounds' `ee.Geometry` with a 40 km buffer. Note that it will only
 * return results for granules that intersect land on the descending path.
 * 
 * @param {string} granuleId The PPPRRR granule ID.
 * @returns {ee.Dictionary}
 * @example
 * // Get granule geometry for WRS-1 path/row granule 049030.
 * var granuleGeom = msslib.getWrs1GranuleGeom('049030');
 * 
 * // Print the results.
 * print(granuleGeom);
 * 
 * // Display the results.
 * var granule = ee.Feature(granuleGeom.get('granule'));
 * var centroid = ee.Geometry(granuleGeom.get('centroid'));
 * var bounds = ee.Geometry(granuleGeom.get('bounds'));
 * Map.centerObject(centroid, 8);
 * Map.addLayer(bounds, {color: 'blue'}, 'Bounds');
 * Map.addLayer(granule, {color: 'black'}, 'Granule');
 * Map.addLayer(centroid, {color: 'red'}, 'Centroid');
 */
function getWrs1GranuleGeom(granuleId) {
    var granule = ee.Feature(
            ee.FeatureCollection('users/jstnbraaten/wrs/wrs1_descending_land')
            .filter(ee.Filter.eq('PR', granuleId)).first());
    var centroid = granule.centroid(300).geometry(300);
    var bounds = granule.geometry(300).buffer(40000);
    return ee.Dictionary({
        granule: granule,
        centroid: centroid,
        bounds: bounds
    });
}
exports.getWrs1GranuleGeom = getWrs1GranuleGeom;

/**
 * Excludes an image from a collection by image ID. Used as the `algorithm`
 * input to the `ee.List.iterate()` function in the `msslib.filterById()`
 * function.
 *
 * @param {string} id The image ID to filter out of the image collection, given
 *     as the value of the image's 'LANDSAT_SCENE_ID' property.
 * @param {ee.ImageCollection} col The image collection to filter.
 * @returns {ee.ImageCollection} The filtered image collection.
 * @ignore
 */
function _filterById(id, col) {
  return ee.ImageCollection(col).filter(
      ee.Filter.neq('LANDSAT_SCENE_ID', ee.String(id)));
}

/**
 * Excludes a list of images from a collection by image ID. It is used in the
 * `msslib.filterCol()` function.
 *
 * @param {ee.ImageCollection} col The image collection to filter.
 * @param {Array} imgList A list of image IDs to filter out of the image
 *     collection, given as the value of the image's 'system:index' property.
 * @returns {ee.ImageCollection} The filtered image collection.
 * @ignore
 */
function filterById(col, imgList) {
  return ee.ImageCollection(ee.List(imgList).iterate(_filterById, col));
}

/**
 * Filters an MSS image collection by bounds, date, and quality properties.
 * By default, it excludes images that do not have all four reflectance bands
 * present and/or are only processed to level L1G. It is intended to handle
 * only one MSS collection at a time i.e. no merged collections. Used by the
 * `msslib.getCol()` function. 
 *
 * @param {ee.ImageCollection} col The image collection to filter.
 * @param {Object} params See `getCol`.
 * @param {string} wrs An indicator for whether the image collection contains
 *     WRS-1 ('wrs1') or WRS-2 ('wrs2') images.
 * @returns {ee.ImageCollection} The filtered image collection.
 * @ignore
 */
function filterCol(col, params, wrs) {
  // Adjust band present property names depending on WRS (1 or 2).
  var bandsPresent = {
    wrs1: [
      'PRESENT_BAND_4', 'PRESENT_BAND_5', 'PRESENT_BAND_6', 'PRESENT_BAND_7'
    ],
    wrs2: [
      'PRESENT_BAND_1', 'PRESENT_BAND_2', 'PRESENT_BAND_3', 'PRESENT_BAND_4'
    ],
  };

  if (params.aoi) {
    col = col.filterBounds(params.aoi);
  }

  col = col.filter(ee.Filter.neq('DATA_TYPE', 'L1G'))
            .filter(ee.Filter.eq(bandsPresent[wrs][0], 'Y'))
            .filter(ee.Filter.eq(bandsPresent[wrs][1], 'Y'))
            .filter(ee.Filter.eq(bandsPresent[wrs][2], 'Y'))
            .filter(ee.Filter.eq(bandsPresent[wrs][3], 'Y'))
            .filter(ee.Filter.lte('GEOMETRIC_RMSE_VERIFY', params.maxRmseVerify))
            .filter(ee.Filter.lte('CLOUD_COVER', params.maxCloudCover));

  if (params.yearRange) {
    col = col.filter(ee.Filter.calendarRange(
        params.yearRange[0], params.yearRange[1], 'year'));
  }
  if (params.doyRange) {
    col = col.filter(ee.Filter.calendarRange(
        params.doyRange[0], params.doyRange[1], 'day_of_year'));
  }
  if (params.excludeIds) {
    col = filterById(col, params.excludeIds);
  }

  return col;
}

/**
 * Assembles a Landsat MSS image collection from USGS Collection 1 T1 and T2
 * images acquired by satellites 1-5. Removes L1G images and images without a
 * complete set of reflectance bands. Additional default and optional filtering
 * criteria are applied, including by bounds, geometric error, cloud cover,
 * year, and day of year. All image bands are named consistently:
 * ['green', 'red', 'red_edge', 'nir', 'BQA']. Adds 'wrs' property to all images
 * designating them as 'WRS-1' or 'WRS-2'.
 *
 * @param {Object} params An object that provides filtering parameters.
 * @param {ee.Geometry} [params.aoi=null] The geometry to filter images by
 *     intersection; those intersecting the geometry are included in the
 *     collection.
 * @param {number} [params.maxRmseVerify=0.5] The maximum geometric RMSE of a
 *     given image allowed in the collection, provided in units of pixels
 *     (60 m), conditioned on the 'GEOMETRIC_RMSE_VERIFY' image property.
 * @param {number} [params.maxCloudCover=50] The maximum cloud cover of a given
 *     image allowed in the collection, provided as a percent, conditioned on
 *     the 'CLOUD_COVER' image property.
 * @param {string} [params.wrs=1&2] An indicator for what World Reference
 *     System types to allow in the collection. MSS images from Landsat
 *     satellites 1-3 use WRS-1, while 4-5 use WRS-2. Options include: '1'
 *     (WRS-1 only), '2' (WRS-2 only), and '1&2' (both WRS-1 and WRS-2).
 * @param {Array} [params.yearRange=[1972, 2000]] An array with two integers that define
 *     the range of years to include in the collection. The first defines the
 *     start year (inclusive) and the second defines the end year (inclusive).
 *     Ex: [1972, 1990].
 * @param {Array} [params.doyRange=[1, 365]] An array with two integers that define
 *     the range of days to include in the collection. The first defines the
 *     start day of year (inclusive) and the second defines the end day of year
 *     (inclusive). Note that the start day can be less than the end day, which
 *     indicates that the day range crosses the new year. Ex: [180, 240]
 *     (dates for northern hemisphere summer images), [330, 90] (dates for
 *     southern hemisphere summer images).
 * @param {Array} [params.excludeIds=null] A list of image IDs to filter out of
 *     the image collection, given  as the value of the image's
 *     'LANDSAT_SCENE_ID' property.
 * @returns {ee.ImageCollection} An MSS image collection.
 * @example
 * // Filter by geometry intersection, cloud cover, and geometric RMSE.
 * var mssDnCol = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   maxCloudCover: 25,
 *   maxRmseVerify: 0.25
 * });
 * 
 * // Filter by geometry intersection, year range, and day of year.
 * var mssDnCol = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   yearRange: [1975, 1980],
 *   doyRange: [170, 240] 
 * });
 * 
 * // Filter by geometry intersection and exclude two images by ID.
 * var mssDnCol = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   excludeIds: ['LM10490291972246AAA04', 'LM10480291973113AAA02']
 * });
 */
function getCol(params) {
  // Define default filter parameters.
  var _params = {
    'aoi': null,
    'maxRmseVerify': 0.5,
    'maxCloudCover': 50,
    'wrs': '1&2',
    'yearRange': [1972, 2000],
    'doyRange': [1, 365],
    'excludeIds': null
  };

  // Replace default params with provided params.
  if (params) {
    for (var param in params) {
      _params[param] = params[param] || _params[param];
    }
  }

  // Initialize WRS-1 and WRS-2 collections.
  var wrs1Col = ee.ImageCollection([]);
  var wrs2Col = ee.ImageCollection([]);

  // Gather MSS WRS-1 images, filter as requested, designate as 'WRS-1'.
  if (_params.wrs.indexOf('1') !== -1) {
    var mss1T1 = filterCol(
        ee.ImageCollection('LANDSAT/LM01/C01/T1'), _params, 'wrs1');
    var mss1T2 = filterCol(
        ee.ImageCollection('LANDSAT/LM01/C01/T2'), _params, 'wrs1');
    var mss2T1 = filterCol(
        ee.ImageCollection('LANDSAT/LM02/C01/T1'), _params, 'wrs1');
    var mss2T2 = filterCol(
        ee.ImageCollection('LANDSAT/LM02/C01/T2'), _params, 'wrs1');
    var mss3T1 = filterCol(
        ee.ImageCollection('LANDSAT/LM03/C01/T1'), _params, 'wrs1');
    var mss3T2 = filterCol(
        ee.ImageCollection('LANDSAT/LM03/C01/T2'), _params, 'wrs1');
    wrs1Col =
        mss1T1.merge(mss1T2)
            .merge(mss2T1)
            .merge(mss2T2)
            .merge(mss3T1)
            .merge(mss3T2)
            .map(function(img) {
              return img.rename(['green', 'red', 'red_edge', 'nir', 'BQA'])
                  .set('wrs', 'WRS-1');
            });
  }

  // Gather MSS WRS-2 images, filter as requested, designate as 'WRS-2'.
  if (_params.wrs.indexOf('2') !== -1) {
    var mss4T1 = filterCol(
        ee.ImageCollection('LANDSAT/LM04/C01/T1'), _params, 'wrs2');
    var mss4T2 = filterCol(
        ee.ImageCollection('LANDSAT/LM04/C01/T2'), _params, 'wrs2');
    var mss5T1 = filterCol(
        ee.ImageCollection('LANDSAT/LM05/C01/T1'), _params, 'wrs2');
    var mss5T2 = filterCol(
        ee.ImageCollection('LANDSAT/LM05/C01/T2'), _params, 'wrs2');
    wrs2Col =
        mss4T1.merge(mss4T2).merge(mss5T1).merge(mss5T2).map(function(img) {
          return img.rename(['green', 'red', 'red_edge', 'nir', 'BQA'])
              .set('wrs', 'WRS-2');
        });
  }

  // Return time-sorted, merged, WRS-1 and WRS-2 collection with filter params
  // attached.
  return wrs1Col
    .merge(wrs2Col)
    .map(function(img) {
      var date = img.date();
      return img.set({
        start_doy: _params.doyRange[0],
        end_doy: _params.doyRange[1],
        year: date.get('year'),
        doy: date.getRelative('day', 'year'),
        pr: getPr(img)
        // composite_year:  // TODO
      });
    })
    .sort('system:time_start');
}
exports.getCol = getCol;


// #############################################################################
// ### IMAGE ASSESSMENT ###
// #############################################################################

// TODO: add example(s) that shows how to use `display` and `visParams`.

/**
 * Prints image collection thumbnails to the console with accompanying image
 * IDs for use in quickly evaluating a collection. The image IDs can be recorded
 * and used as entries in the `params.excludeIds` list of the `msslib.getCol()`
 * function to exclude the given image(s).
 *
 * @param {ee.ImageCollection} col MSS DN image collection originating from the
 *     `msslib.getCol()` function.
 * @param {Object} params An object that provides visualization parameters.
 * @param {string} [params.unit=toa] An indicator for what units to use in the
 *     display image. Use: 'dn' (raw digital number), 'rad' (radiance), or
 *     'toa' (TOA reflectance). The selected unit will be calculated on-the-fly.
 * @param {string} [params.display=nir\|red\|green] An indicator for how to
 *     display the image thumbnail. Use 'nir\|red\|green' (RGB) or 'ndvi'
 *     (grayscale). Default visualization parameters for color stretch are
 *     applied.
 * @param {Object} [params.visParams=null] A custom visualization parameter
 *     dictionary as described [here](https://developers.google.com/earth-engine/image_visualization#mapVisParamTable).
 *     If set, overrides the `params.display` option and default.
 * @example
 * // Get an MSS image collection.
 * var mssDnCol = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   doyRange: [170, 240] 
 * });
 * 
 * // View DN image thumbnails in the console.
 * viewThumbnails(mssDnCol, {unit: 'dn'});
 */
function viewThumbnails(col, params) {
  print('Please wait patiently, images may not load immediately');

  var _params = {
    unit: 'toa',
    display: 'nir|red|green',
    visParams: null
  };

  if (params) {
    for (var param in params) {
      _params[param] = params[param] || _params[param];
    }
  }
  
  var settings = {
    unit: {
      dn: function(img) {return img},
      rad: calcRad,
      toa: calcToa
    },
    display: {
      'nir|red|green': {
        dn: visDn,
        rad: visRad,
        toa: visToa  
      },
      'ndvi': {
        dn: visNdvi,
        rad: visNdvi,
        toa: visNdvi
      }
    }
  };

  var imgList = col.sort('system:time_start').toList(col.size());

  imgList.evaluate(function(imgList) {
    for (var i = 0; i < imgList.length; i++) {
      var id = imgList[i].id;
      var img = ee.Image(id).rename(['green', 'red', 'red_edge', 'nir', 'BQA']);
      img = settings.unit[_params.unit](img);
      if(_params.display == 'ndvi') {
        img = addNdvi(img);
      }
      var visParams = settings.display[_params.display][_params.unit];
      if(_params.visParams) {
        visParams = _params.visParams;
      }
      var imgVis = img.visualize(visParams);
      print(img.get('LANDSAT_SCENE_ID'));
      print(ui.Thumbnail(imgVis, {
        dimensions: 512,
        crs: 'EPSG:3857',
      }));
    }
  });
}
exports.viewThumbnails = viewThumbnails;

// #############################################################################
// ### IMAGE MANIPULATION ###
// #############################################################################

/**
 * Converts DN values to either radiance or TOA reflectance.
 *
 * @param {ee.Image} img MSS DN image originating from the `msslib.getCol()`
 *     function.
 * @param {string} unit Indicator for whether to convert DN to units of radiance
 *     ('radiance') or TOA reflectance ('reflectance').
 * @return {ee.Image}
 * @ignore
 */
function scaleDn(img, unit) {
  var mult = 'REFLECTANCE_MULT_BAND', add = 'REFLECTANCE_ADD_BAND';
  if (unit == 'radiance') {
    mult = 'RADIANCE_MULT_BAND';
    add = 'RADIANCE_ADD_BAND';
  }

  var gainBands = ee.List(img.propertyNames())
                      .filter(ee.Filter.stringContains('item', mult))
                      .sort();
  var biasBands = ee.List(img.propertyNames())
                      .filter(ee.Filter.stringContains('item', add))
                      .sort();

  var gainImg = ee.Image.cat(
      ee.Image.constant(img.get(gainBands.getString(0))),
      ee.Image.constant(img.get(gainBands.getString(1))),
      ee.Image.constant(img.get(gainBands.getString(2))),
      ee.Image.constant(img.get(gainBands.getString(3)))).toFloat();

  var biasImg = ee.Image.cat(
      ee.Image.constant(img.get(biasBands.getString(0))),
      ee.Image.constant(img.get(biasBands.getString(1))),
      ee.Image.constant(img.get(biasBands.getString(2))),
      ee.Image.constant(img.get(biasBands.getString(3)))).toFloat();

  var dnImg = img.select([0, 1, 2, 3]);

  return ee.Image(
    dnImg.multiply(gainImg)
      .add(biasImg)
      .toFloat()
      .addBands(img.select('BQA'))
      .copyProperties(img, img.propertyNames()));
}

/**
 * Converts DN values to radiance.
 *
 * @param {ee.Image} img MSS DN image originating from the `msslib.getCol()`
 *     function.
 * @return {ee.Image}
 * @example
 * // Get an MSS image collection.
 * var mssDnCol = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   doyRange: [170, 240] 
 * });
 * 
 * // Convert DN to radiance for a single image.
 * var mssRadImg = msslib.calcRad(mssDnCol.first());
 * 
 * // Convert DN to radiance for all images in a collection.
 * var mssRadCol = mssDnCol.map(msslib.calcRad);
 */
function calcRad(img) {
  return scaleDn(img, 'radiance');
}
exports.calcRad = calcRad;

/**
 * Converts DN values to TOA reflectance.
 *
 * @param {ee.Image} img MSS DN image originating from the `msslib.getCol()`
 *     function.
 * @return {ee.Image}
 * @example
 * // Get an MSS image collection.
 * var mssDnCol = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   doyRange: [170, 240] 
 * });
 * 
 * // Convert DN to TOA for a single image.
 * var mssToaImg = msslib.calcToa(mssDnCol.first());
 * 
 * // Convert DN to TOA for all images in a collection.
 * var mssToaCol = mssDnCol.map(msslib.calcToa);
 */
function calcToa(img) {
  return scaleDn(img, 'reflectance');
}
exports.calcToa = calcToa;

// TODO: add example of applying to a single image.

/**
 * Adds NDVI transformation as a band ('ndvi') to the input image.
 *
 * @param {ee.Image} img MSS image originating from the `msslib.getCol()`
 *     function. It is recommended that the image be in units of radiance or
 *     TOA reflectance (see `msslib.calcRad()` and `msslib.calcToa()`).
 * @return {ee.Image}
 * @example
 * // Get an MSS image collection.
 * var mssDnCol = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   doyRange: [170, 240] 
 * });
 * 
 * // Convert DN to TOA for all images in a collection.
 * var mssToaCol = mssDnCol.map(msslib.calcToa);
 * 
 * // Add NDVI band to each image in a collection.
 * var mssToaColNdvi = mssToaCol.map(msslib.addNdvi);
 */
function addNdvi(img) {
  var ndvi = img.normalizedDifference(['nir', 'red']).rename('ndvi');
  return ee.Image(img.addBands(ndvi).copyProperties(img, img.propertyNames()));
}
exports.addNdvi = addNdvi;

// TODO: Need to ensure use of the proper units - paper seems to suggest DN
// and also the use of an offset - see section IV, eq 1. Should it be
// capitalized?

/**
 * Adds Tasseled Cap indices brightness ('tcb'), greenness ('tcg'), and
 * angle ('tca') to the input image. See [Kauth and Thomas, 1976](https://docs.lib.purdue.edu/cgi/viewcontent.cgi?article=1160&context=lars_symp)
 * 
 * @param {ee.Image} img MSS image originating from the `msslib.getCol()`
 *     function. It is recommended that the image be in units of radiance or
 *     TOA reflectance (see `msslib.calcRad()` and `msslib.calcToa()`).
 * @return {ee.Image}
 * @example
 * // Get an MSS image collection.
 * var mssDnCol = msslib.getCol({
 *   aoi: ee.Geometry.Point([-122.239, 44.018]),
 *   doyRange: [170, 240] 
 * });
 * 
 * // Convert DN to TOA for all images in a collection.
 * var mssToaCol = mssDnCol.map(msslib.calcToa);
 * 
 * // Add Tasseled Cap band to each image in a collection.
 * var mssToaColTc = mssToaCol.map(msslib.addTc);
 * @ignore
 */
function addTc(img) {
  var bands = img.select([0, 1, 2, 3]);
  var tcbCoeffs = ee.Image.constant([0.433, 0.632, 0.586, 0.264]);
  var tcgCoeffs = ee.Image.constant([-0.290, -0.562, 0.600, 0.491]);
  var tcb = bands.multiply(tcbCoeffs).reduce(ee.Reducer.sum()).toFloat();
  var tcg = bands.multiply(tcgCoeffs).reduce(ee.Reducer.sum()).toFloat();
  var tca = (tcg.divide(tcb)).atan().multiply(180 / Math.PI).toFloat();
  var tc = ee.Image.cat(tcb, tcg, tca).rename('tcb', 'tcg', 'tca');
  return ee.Image(img.addBands(tc).copyProperties(img, img.propertyNames()));
}
exports.addTc = addTc;




// #############################################################################
// ### BQA MASK ###
// #############################################################################

/**
 * Get the 'BQA' quality band as a Boolean layer indicating good (1) and bad (0)
 * pixels. [Learn more about the 'BQA' band](https://www.usgs.gov/land-resources/nli/landsat/landsat-collection-1-level-1-quality-assessment-band).
 *
 * @param {ee.Image} img MSS image originating from the `msslib.getCol()`
 *     function.
 * @return {ee.Image}
 * @ignore
 */
function getQaMask(img) {
  return img.select('BQA').eq(32).rename('BQA_mask');
}

/**
 * Adds the 'BQA' quality band as mask band ('BQA_mask') indicating good (1) and
 * bad (0) pixels. [Learn more about the 'BQA' band](https://www.usgs.gov/land-resources/nli/landsat/landsat-collection-1-level-1-quality-assessment-band).
 *
 * @param {ee.Image} img MSS image originating from the `msslib.getCol()`
 *     function.
 * @return {ee.Image}
 * @example
 * // Get an MSS image collection.
 * var mssDnCol = msslib.getCol({
 *         aoi: ee.Geometry.Point([-122.239, 44.018]),
 *         doyRange: [170, 240]
 *     });
 * 
 * // Select a single image.
 * var mssDnImg = mssDnCol.filter( 
 *         ee.Filter.eq('LANDSAT_SCENE_ID', 'LM30490291982193AAA03')).first();
 * 
 * // Add BQA mask band to the single image.
 * var mssDnImgQaMask = msslib.addQaMask(mssDnImg);
 * 
 * // Display the results.
 * Map.centerObject(mssDnImgQaMask, 9);
 * Map.addLayer(mssDnImgQaMask, msslib.visDn, 'DN image');
 * Map.addLayer(mssDnImgQaMask, {
 *     bands: ['BQA_mask'],
 *     min: 0,
 *     max: 1,
 *     palette: ['grey', 'green']
 * }, 'BQA mask');
 * 
 * // Add BQA mask band to all images in collection.
 * var mssDnColQaMask = mssDnCol.map(msslib.addQaMask);
 * print(mssDnColQaMask.limit(5));
 */
function addQaMask(img) {
  return img.addBands(getQaMask(img));
}
exports.addQaMask = addQaMask;

/**
 * Applies the 'BQA' quality band to an image as a mask. It masks out cloud
 * pixels and those exhibiting radiometric saturation, as well pixels associated
 * with missing data. Cloud identification is limited to mostly thick cumulus
 * clouds; note that snow and very bright surface features are often mislabeled
 * as cloud. Radiometric saturation in MSS images usually manifests as entire
 * or partial image pixel rows being highly biased toward high values in a
 * single band, which when visualized, can appear as tinted red, green, or
 * blue. [Learn more about the 'BQA' band](https://www.usgs.gov/land-resources/nli/landsat/landsat-collection-1-level-1-quality-assessment-band).
 *
 * @param {ee.Image} img MSS image originating from the `msslib.getCol()`
 *     function.
 * @return {ee.Image}
 * @example
 * // Get an MSS image collection.
 * var mssDnCol = msslib.getCol({
 *         aoi: ee.Geometry.Point([-122.239, 44.018]),
 *         doyRange: [170, 240]
 *     });
 * 
 * // Select a single image.
 * var mssDnImg = mssDnCol.filter( 
 *         ee.Filter.eq('LANDSAT_SCENE_ID', 'LM30490291982193AAA03')).first();
 * 
 * // Apply BQA mask to the single image.
 * var mssDnImgQaMask = msslib.applyQaMask(mssDnImg);
 * 
 * // Display the results.
 * Map.centerObject(mssDnImgQaMask, 9);
 * Map.setOptions('SATELLITE');
 * Map.addLayer(mssDnImg, msslib.visDn, 'DN image');
 * Map.addLayer(mssDnImgQaMask, msslib.visDn, 'DN image masked');
 * 
 * // Apply BQA mask to all images in collection.
 * var mssDnColQaMask = mssDnCol.map(msslib.applyQaMask);
 * print(mssDnColQaMask.limit(5));
 */
function applyQaMask(img) {
  return img.updateMask(getQaMask(img));
}
exports.applyQaMask = applyQaMask;




// #############################################################################
// ### MSSCVM ###
// #############################################################################

/**
 * Returns MSScvm cloud layer.
 *
 * @param {ee.Image} img MSS TOA image originating from `msslib.getCol()`
 *     and `msslib.calcToa()`.
 * @return {ee.Image}
 * @ignore
 */
function cloudLayer(img) {
  // Identify cloud pixels.
  var cloudPixels = img.normalizedDifference(['green', 'red'])
                        .gt(0)
                        .multiply(img.select('green').gt(0.175))  // 1750
                        .add(img.select('green').gt(0.39))  // 3900
                        .gt(0);

  // Nine-pixel minimum connected component sieve.
  cloudPixels = cloudPixels.selfMask()
                    .connectedPixelCount(10, true)
                    .reproject(img.projection())
                    .gte(0)
                    .unmask(0)
                    .rename('cloudtest');

  // Define kernel for buffer.
  var kernel = ee.Kernel.circle({radius: 2, units: 'pixels', normalize: true});

  // Two pixel buffer, eight neighbor rule.
  return cloudPixels.focal_max({radius: 2, kernel: kernel})
      .reproject(img.projection())
      .rename('clouds');
}

/**
 * Returns MSScvm water layer.
 *
 * @param {ee.Image} img MSS TOA image originating from `msslib.getCol()`
 *     and `msslib.calcToa()`.
 * @return {ee.Image}
 * @ignore
 */
function waterLayer(img) {
  // Threshold on NDVI.
  var mssWater = img.normalizedDifference(['nir', 'red']).lt(-0.085);

  // Get max extent of water 1985-2018.
  var waterExtent =
      ee.Image('JRC/GSW1_1/GlobalSurfaceWater').select('max_extent');

  // Get intersection of MSS water and max extent.
  return mssWater.multiply(waterExtent)
      .reproject(img.projection())
      .rename('water');
}

/**
 * Assembles a global DEM from several sources, returned in the projection of
 * the input image.
 *
 * @param {ee.Image} img MSS TOA image originating from `msslib.getCol()`
 *     and `msslib.calcToa()`.
 * @return {ee.Image}
 * @ignore
 */
function getDem(img) {
  var aw3d30 =
      ee.Image('JAXA/ALOS/AW3D30/V2_2').select('AVE_DSM').rename('elev');
  var GMTED2010 = ee.Image('USGS/GMTED2010').rename('elev');
  return ee.ImageCollection([GMTED2010, aw3d30])
      .mosaic()
      .reproject(img.projection());
}
exports.getDem = getDem;

/**
 * Converts degrees to radians.
 *
 * @param {ee.Image} img An image with pixel values in units of degrees.
 * @return {ee.Image}
 * @ignore
 */
function radians(img) {
  return img.toFloat().multiply(Math.PI).divide(180);
}

/**
 * Returns terrain illumination image.
 *
 * @param {ee.Image} img MSS TOA image originating from `msslib.getCol()`
 *     and `msslib.calcToa()`.
 * @param {ee.Image} slope A terrain slope image in units of degrees.
 * @param {ee.Image} aspect A terrain aspect image in units of degrees.
 * @return {ee.Image}
 * @ignore
 */
function getIll(img, slope, aspect) {
  // Get sun info.
  var azimuth = img.get('SUN_AZIMUTH');
  var zenith = ee.Number(90).subtract(img.getNumber('SUN_ELEVATION'));

  // Convert slope and aspect degrees to radians.
  var slopeRad = radians(slope);
  var aspectRad = radians(aspect);

  // Calculate illumination.
  var azimuthImg = radians(ee.Image.constant(azimuth));
  var zenithImg = radians(ee.Image.constant(zenith));
  var left = zenithImg.cos().multiply(slopeRad.cos());
  var right = zenithImg.sin()
                  .multiply(slopeRad.sin())
                  .multiply(azimuthImg.subtract(aspectRad).cos());
  return left.add(right);
}

/**
 * Returns MSS NIR TOA reflectance band corrected for topography via
 * Minnaert correction.
 *
 * @param {ee.Image} img MSS TOA image originating from `msslib.getCol()`
 *     and `msslib.calcToa()`.
 * @param {ee.Image} dem A digital elevation model.
 * @return {ee.Image}
 * @ignore
 */
function topoCorrB4(img, dem) {
  // Get terrain layers.
  var terrain = ee.Algorithms.Terrain(dem);
  var slope = terrain.select(['slope']);
  var aspect = terrain.select(['aspect']);

  // Get k image.
  // define polynomial coefficients to calc Minnaert value as function of slope
  // Ge, H., Lu, D., He, S., Xu, A., Zhou, G., & Du, H. (2008). Pixel-based
  // Minnaert correction method for reducing topographic effects on a Landsat 7
  // ETM+ image. Photogrammetric Engineering & Remote Sensing, 74(11),
  // 1343-1350. |
  // https://orst.library.ingentaconnect.com/content/asprs/pers/2008/00000074/00000011/art00003?crawler=true&mimetype=application/pdf
  var kImg = slope.resample('bilinear')
                 .where(
                     slope.gt(50),
                     50)  // Set max slope at 50 degrees - paper does not sample
                          // past - authors recommend no extrapolation.
                 .polynomial([
                   1.0021313684, -0.1308793751, 0.0106861276, -0.0004051135,
                   0.0000071825, -4.88e-8
                 ]);

  // Get illumination.
  var ill = getIll(img, slope, aspect);

  // Correct NIR reflectance for topography.
  var cosTheta = radians(ee.Image.constant(ee.Number(90).subtract(
                             ee.Number(img.get('SUN_ELEVATION')))))
                     .cos();
  var correction = (cosTheta.divide(ill)).pow(kImg);
  return img.select('nir').multiply(correction);
}
exports.topoCorrB4 = topoCorrB4;

/**
 * Returns MSScvm shadow layer.
 *
 * @param {ee.Image} img MSS TOA image originating from `msslib.getCol()`
 *     and `msslib.calcToa()`.
 * @param {ee.Image} dem A digital elevation model.
 * @param {ee.Image} clouds The result of `msslib.cloudLayer()`.
 * @return {ee.Image}
 * @ignore
 */
function shadowLayer(img, dem, clouds) {
  // Correct B4 reflectance for topography.
  var b4c = topoCorrB4(img, dem);

  // Threshold B4 - target dark pixels.
  var shadows = b4c.lt(0.11);  // Make this true for all pixels to use full cloud projection. 

  // Project clouds as potential shadow.
  var shadow_azimuth =
      ee.Number(90).subtract(ee.Number(img.get('SUN_AZIMUTH')));
  var cloudProj = clouds.directionalDistanceTransform(shadow_azimuth, 50)
                      .reproject({crs: img.projection(), scale: 60})
                      .select('distance')
                      .gt(0)
                      .unmask(0);

  // Get water layer.
  var water = waterLayer(img);

  // Exclude water pixels from intersection of cloud projection and dark pixels.
  return shadows.multiply(water.not())
      .multiply(cloudProj)
      .focal_max(2)
      .reproject(img.projection());
}

/**
 * Adds the MSScvm band ('msscvm') to the input image. Value 0 designates pixels
 * as clear, 1 as clouds, and 2 as shadows. [Learn about MSScvm](https://jdbcode.github.io/MSScvm/imgs/braaten_et_al_2015_automated%20cloud_and_cloud_shadow_identification_in_landsat_mss_imagery_for_temperate_ecosystems.pdf).
 *
 * @param {ee.Image} img MSS TOA image originating from `msslib.getCol()`
 *     and `msslib.calcToa()`.
 * @return {ee.Image}
 * @example
 * // Get an MSS image collection.
 * var mssDnCol = msslib.getCol({
 *         aoi: ee.Geometry.Point([-122.239, 44.018]),
 *         doyRange: [170, 240],
 *         yearRange: [1983, 1986],
 *         wrs: '2'
 *     });
 * 
 * // Convert DN to TOA.
 * var mssToaCol = mssDnCol.map(msslib.calcToa);
 * 
 * // Select a single image.
 * var mssToaImg = mssToaCol.filter(
 *         ee.Filter.eq('LANDSAT_SCENE_ID', 'LM50450301986215AAA03')).first();
 * 
 * // Add MSScvm band to the single image.
 * var mssToaImgMsscvm = msslib.addMsscvm(mssToaImg);
 * 
 * // Display the results.
 * Map.centerObject(mssToaImgMsscvm, 9);
 * Map.addLayer(mssToaImgMsscvm, msslib.visToa, 'TOA image');
 * Map.addLayer(mssToaImgMsscvm, {
 *     bands: ['msscvm'],
 *     min: 0,
 *     max: 2,
 *     palette: ['27ae60', 'FFFFFF', '000000']
 * }, 'MSScmv');
 * 
 * // Add MSScvm band to all images in collection.
 * var mssToaColMsscvm = mssToaCol.map(msslib.addMsscvm);
 * print(mssToaColMsscvm.limit(5));
 */
function addMsscvm(img) {
  var dem = getDem(img);
  var water = waterLayer(img);
  var b4c = topoCorrB4(img, dem);
  var clouds = cloudLayer(img).selfMask();
  var shadows = shadowLayer(img, dem, clouds).selfMask().add(1);
  return img.addBands(shadows.blend(clouds).unmask(0).rename('msscvm'));
}
exports.addMsscvm = addMsscvm;

/**
 * Applies the MSScvm mask to the input image, i.e., pixels identified as cloud
 * or cloud shadow are masked out. [Learn about MSScvm](https://jdbcode.github.io/MSScvm/imgs/braaten_et_al_2015_automated%20cloud_and_cloud_shadow_identification_in_landsat_mss_imagery_for_temperate_ecosystems.pdf).
 *
 * @param {ee.Image} img MSS TOA image originating from `msslib.getCol()`
 *     and `msslib.calcToa()`.
 * @return {ee.Image}
 * @example
 * // Get an MSS image collection.
 * var mssDnCol = msslib.getCol({
 *         aoi: ee.Geometry.Point([-122.239, 44.018]),
 *         doyRange: [170, 240],
 *         yearRange: [1983, 1986],
 *         wrs: '2'
 *     });
 * 
 * // Convert DN to TOA.
 * var mssToaCol = mssDnCol.map(msslib.calcToa);
 * 
 * // Select a single image.
 * var mssToaImg = mssToaCol.filter(
 *         ee.Filter.eq('LANDSAT_SCENE_ID', 'LM50450301986215AAA03')).first();
 *         
 * // Apply MSScvm to the single image.
 * var mssToaImgMsscvm = msslib.applyMsscvm(mssToaImg);
 * 
 * // Display the results.
 * Map.centerObject(mssToaImgMsscvm, 9);
 * Map.setOptions('SATELLITE');
 * Map.addLayer(mssToaImg, msslib.visToa, 'TOA image');
 * Map.addLayer(mssToaImgMsscvm, msslib.visToa, 'TOA image masked');
 *         
 * // Apply MSScvm to all images in collection.
 * var mssToaColMsscvm = mssToaCol.map(msslib.applyMsscvm);
 * print(mssToaColMsscvm.limit(5));
 */
function applyMsscvm(img) {
  var dem = getDem(img);
  var water = waterLayer(img);
  var b4c = topoCorrB4(img, dem);
  var clouds = cloudLayer(img);
  var shadows = shadowLayer(img, dem, clouds);
  var mask = clouds.add(shadows).eq(0);
  return img.updateMask(mask);
}
exports.applyMsscvm = applyMsscvm;
