// Year list to map
var yearList = [1990, 1995, 2000, 2005, 2010, 2015, 2020,2024];

// Function to filter
function filterCol(col, roi, date){
  return col.filterDate(date[0], date[1]).filterBounds(roi);
}

// Composite function
function landsat457(roi, date){
  var col = filterCol(l4, roi, date).merge(filterCol(l5, roi, date)).merge(filterCol(l7, roi, date));
  var image = col.map(cloudMaskTm).median().clip(roi);
  return image;
}

function landsat89(roi, date){
  var col = filterCol(l8, roi, date).merge(filterCol(l9, roi, date));
  var image = col.map(cloudMaskOli).median().clip(roi);
  return image;
}

// Cloud mask
function cloudMaskTm(image){
  var qa = image.select('QA_PIXEL');
  var dilated = 1 << 1;
  var cloud = 1 << 3;
  var shadow = 1 << 4;
  var mask = qa.bitwiseAnd(dilated).eq(0)
    .and(qa.bitwiseAnd(cloud).eq(0))
    .and(qa.bitwiseAnd(shadow).eq(0));
  
  return image.select(['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'], ['B2', 'B3', 'B4', 'B5', 'B6', 'B7']).updateMask(mask);
}

function cloudMaskOli(image){
  var qa = image.select('QA_PIXEL');
  var dilated = 1 << 1;
  var cirrus = 1 << 2;
  var cloud = 1 << 3;
  var shadow = 1 << 4;
  var mask = qa.bitwiseAnd(dilated).eq(0)
    .and(qa.bitwiseAnd(cirrus).eq(0))
    .and(qa.bitwiseAnd(cloud).eq(0))
    .and(qa.bitwiseAnd(shadow).eq(0));
  
  return image.select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'], ['B2', 'B3', 'B4', 'B5', 'B6', 'B7']).updateMask(mask);
}

// Generate image per year
var coastCol = ee.ImageCollection(yearList.map(function(year){
  var start;
  var end;
  
  // Conditional on landsat collection to use
  var landsat;
  if (year < 2014) {
    start = ee.Date.fromYMD(year - 1 , 1, 1);
    end = ee.Date.fromYMD(year + 1, 12, 31);
    landsat = landsat457;
  } else {
    start = ee.Date.fromYMD(year , 1, 1);
    end = ee.Date.fromYMD(year, 12, 31);
    landsat = landsat89;
  }
  
  var date = [start, end];
  
  // Create an image composite
  var image = landsat(roi, date).multiply(0.0000275).add(-0.2);
  
  // Show the image
  Map.addLayer(image, { min: [0.1, 0.05, 0], max: [0.4, 0.3, 0.2], bands: ['B5', 'B6', 'B2'] }, 'Landsat_' + year, false);
  
  // Band map
  var bandMap = { 
    NIR: image.select('B5'), 
    SWIR: image.select('B6'), 
    RED: image.select('B4'), 
    GREEN: image.select('B3'), 
    BLUE: image.select('B2') 
  };
  
  // Normalized Difference Water Index
  var ndwi = image.expression('(GREEN - NIR) / (GREEN + NIR)', bandMap).rename('NDWI');
  Map.addLayer(ndwi, { min: -1, max: 1, palette: ['red', 'white', 'blue'] }, 'NDWI_' + year, false);

  // Land area
  var land = ndwi.lt(0.1).selfMask();
  Map.addLayer(land, { palette: 'gold' }, 'Land_' + year, false);
  
  // Land area
  var water = ndwi.gte(0.1).selfMask();
  Map.addLayer(water, { palette: 'navy' }, 'Water_' + year, false);
  
  return land.multiply(year).rename('coast').toUint16();
}));

// Forest visual
var vis = {
  'coast_class_values': yearList,
  'coast_class_palette': ['800080', '0000FF', '00FFFF', '228B22', 'FFD700', 'FF8C00','d664d5', 'FF0000']
};

// Coastal change
var coastalChange = coastCol.max().set(vis);
Map.addLayer(coastalChange, {}, 'Coastalline change');

// Create legend to show the coastline year
var panel = ui.Panel([ui.Label('Coastline change')], ui.Panel.Layout.flow('vertical'), { position: 'bottom-left' });
vis.coast_class_values.map(function(value, index){
  panel.add(ui.Panel(
    [
      ui.Label('', { width: '30px', height: '20px', backgroundColor: vis.coast_class_palette[index] }),
      ui.Label(value, { height: '20px' })
    ], 
    ui.Panel.Layout.flow('horizontal')
  ));
});
Map.add(panel);


// Calculate the coastline area for each year
var coastlineAreas = yearList.map(function (year) {
  var coastLayer = coastalChange.eq(year).selfMask(); // Get only the pixels corresponding to the given year
  var area = coastLayer.multiply(ee.Image.pixelArea()).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: roi,
    scale: 30,
    maxPixels: 1e13,
  });

  return ee.Feature(null, {
    year: year,
    coastline_area: area.get('coast'), // Create a field for coastline area
  });
});

// Convert to a feature collection
var coastlineFeatureCollection = ee.FeatureCollection(coastlineAreas);

// Create a chart showing the change in coastline area over time
var shorelineChangeChart = ui.Chart.feature.byFeature(
  coastlineFeatureCollection,
  'year', // x-axis property
  ['coastline_area'] // y-axis property
)
  .setChartType('LineChart') // Line chart to show progression
  .setOptions({
    title: 'Shoreline Change Over Time',
    hAxis: { title: 'Year' },
    vAxis: { title: 'Coastline Area (sq m)' },
    lineWidth: 2,
    pointSize: 5,
  });


// Display the chart on the map
print(shorelineChangeChart);
