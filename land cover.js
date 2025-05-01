var image = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterDate('2018-08-01', '2018-12-30')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .filterBounds(roi)
  .median().clip(roi);

var visParamsTrue = {bands: ['B4', 'B3', 'B2'], min: 0, max: 2500, gamma: 1.1};
Map.addLayer(image, visParamsTrue, "aoi");
Map.centerObject(roi, 15);


// Check the bands in the image collection


 var training = vegetation.merge(builtup).merge(barrenland).merge(water);
 print(training);


 var label = 'Class';
 var baq = ['B2', 'B3', 'B4', 'B8'];
 var input = image.select(baq);


 var trainImage = input.sampleRegions({
   collection: training,
   properties: [label],
   scale: 30
 });
 var trainingata = trainImage.randomColumn();
 var trainSet = trainingata.filter(ee.Filter.lt('random', 0.8));
 var testSet = trainingata.filter(ee.Filter.gte('random', 0.8));


var numberOfTrees = 10; // You can adjust this value as needed
var classi = ee.Classifier.smileRandomForest({
  numberOfTrees: numberOfTrees,
  variablesPerSplit: 4, // Adjust as needed
  minLeafPopulation: 1, // Adjust as needed
  bagFraction: 0.5, // Adjust as needed
  maxNodes: null, // or specify a maximum number of nodes if needed
  seed: 0 // Set a seed for reproducibility if needed
}).train(trainSet, label, baq);





var classif = ee.Classifier.smileNaiveBayes().train(trainSet, label, baq);
var classifier = ee.Classifier.smileCart().train(trainSet, label, baq);
var classifierRF = input.classify(classi);
 var classifierNaive = input.classify(classif);
 var classifierCART = input.classify(classifier);

 var landcoverPalette = ['#0f8b2b', '#ff5353', '#ffc82d', '#0c07ff'];
Map.addLayer(classifierRF, {palette: landcoverPalette, min: 1, max: 4}, 'RandomForest');
 Map.addLayer(classifierCART, {palette: landcoverPalette, min:1 , max: 4}, 'CART');
Map.addLayer(classifierNaive, {palette: landcoverPalette, min:1, max: 4}, 'Naive');

 var confusionMatrix = ee.ConfusionMatrix(testSet.classify(classifier)
   .errorMatrix({
     actual: 'Class', 
     predicted: 'classification'
   }));
   //naivebayes 
    var confusionMatri = ee.ConfusionMatrix(testSet.classify(classif)
   .errorMatrix({
     actual: 'Class', 
     predicted: 'classification'
   }));
   //rf
    var confusionMatrx = ee.ConfusionMatrix(testSet.classify(classi)
   .errorMatrix({
     actual: 'Class', 
     predicted: 'classification'
   }));
   

print('Confusion matrix:', confusionMatrix);
print('Confusion matrix:', confusionMatri);
print('Confusion matrix:', confusionMatrx);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Overall Accuracy:', confusionMatri.accuracy());
print('Overall Accuracy:', confusionMatrx.accuracy());

var classes = ['0','vegetation','builtup','barrenland','water'];
var chart = ui.Chart.image.byClass({
  image:ee.Image.pixelArea().multiply(1e-6).addBands(classifierRF.rename('classificaiton')) , 
  classBand:'classificaiton', 
  region: roi, 
  reducer: ee.Reducer.sum(), 
  scale:10, 
  classLabels:classes
  }).setOptions({
    title:'LULC AREA 2018',
    vAxis:{title:'Area (SqKm)'},
    hAxis:{title:'Classes'},
    colors: landcoverPalette//['#67feff','#f89518','#fff292','#0dff37','#bf04c2']
  })
  
print(chart)
// 10. Create a custom legend (color bar)
// Legen panel for Rainfall
var legendRF = ui.Panel([],ui.Panel.Layout.flow('vertical'), {position: 'bottom-right'});
Map.add(legendRF)
legendPanel('Legend', { min: -1, max: 1, palette: ['blue', 'white', 'green'], opacity: 0.8}, legendRF);

// // Legen panel for Rainfall
// var legendRF = ui.Panel([],ui.Panel.Layout.flow('vertical'), {position: 'bottom-right'});
// Map.add(legendRF)
// legendPanel('Rainfall (mm)', {min: 0.0, max: 17.0, palette: [], opacity: 0.8}, legendRF);

//Legend
function legendPanel(title, visual, legend){
    //create legend title
      var legendTitle = ui.Label({
	value: title,
	style: {
	fontWeight: 'bold',
	fontSize: '15px',
	textAlign: 'center',
	stretch: 'horizontal'
	}
   });
   // add title to panel
   legend.add(legendTitle);

   // create the legend image
   var lon = ee.Image.pixelLonLat().select('latitude');
   var gradient = lon.multiply((visual.max-visual.min)/100.0).add(visual.min);
   var legendImage = gradient.visualize(visual);

   // text on top of legend
   var max = ui.Label({
       value: visual.max,
       style: {textAlign: 'center', stretch: 'horizontal'}
      });
      legend.add(max);

   // thumbnail from the image
   var thumbnail = ui.Thumbnail({
       image: legendImage,
       params: {bbox: '0,0,10,100', dimensions: '10x30'},
       style: {textAlign: 'center', /*stretch: 'horizontal',*/ height: '150px'}
      });
      legend.add(thumbnail);

   // text on bottom of legend
   var min = ui.Label({
       value: visual.min,
       style: {textAlign: 'center', stretch: 'horizontal'}
      });
      legend.add(min);
      
      return legend;
}

// Create a panel
var legendRF = ui.Panel([], ui.Panel.Layout.flow('horizontal'), { position: 'top-center' });

// Add the title to the panel
var title = ui.Label('land cover', { fontWeight: 'bold', fontSize: '18px', margin: '6px 0 0 0', padding: '0 0 0 0' });
legendRF.add(title);

// Add the panel to the Map
Map.add(legendRF);
