# msslib

The aim of `msslib` is to make it easy to work with Landsat MSS data in Earth
Engine. It assembles image collections across the five satellites that carried
the MSS sensor, filters images for quality, calculates TOA reflectance, and
calculates the MSScvm cloud mask.

## Guide

### Module import

Include the following line at the top of every script to import the library.

```js
var msslib = require('users/jstnbraaten/modules:msslib/msslib.js');
```

### Example workflow

This example demonstrates how to assemble an MSS image collection, view
thumbnails to assess quality, reassemble collection to remove bad images,
transform the images to TOA reflectance, add an NDVI band, and apply QA and 
cloud/shadow masks.

Import the `msslib` module.

```js
var msslib = require('users/jstnbraaten/modules:msslib/msslib.js');
```

Get an MSS image collection filtered by region and day of year, as well as
default settings for cloud and RMSE.

```js
var mssDnCol = msslib.getCol({
  aoi: ee.Geometry.Point([-122.239, 44.018]),
  doyRange: [170, 240] 
});
```

View image thumbnails to get a sense for quality.

```js
msslib.viewThumbnails(mssDnCol);
```

Retrieve an image collection again, but this time exclude bad images identified
previously.

```js
var mssDnCol = msslib.getCol({
  aoi: ee.Geometry.Point([-122.239, 44.018]),
  doyRange: [170, 240],
  excludeIds: ['LM10480291974234GDS03', 'LM20490291975185GDS03']
});
```

Convert the collection to top of atmosphere reflectance.

```js
var mssToaCol = mssDnCol.map(msslib.calcToa);
```

Add the NDVI transformation as a band to all images in the collection.

```js
mssToaCol = mssToaCol.map(msslib.addNdvi);
```

Apply the MSS clear-view-mask
([MSScvm](https://jdbcode.github.io/MSScvm/index.html)) to all images in the
collection to remove clouds and cloud shadows.

```js
mssToaCol = mssToaCol.map(msslib.applyMsscvm);
```

Apply QA band to all images in the collection.

```js
mssToaCol = mssToaCol.map(msslib.applyQaMask);
```

## Components

