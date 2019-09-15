//@File(label="Images Directory...", style="directory") IMGDIR
//@Boolean(label="Filename Patterns", value=true ) pattern
//@String(label="Segmentation",value="0001procstk") CSEG
//@String(label="Fluorescent chanel",value="w1cf-Brightfield") C1
//@int(label="Min. Intensity", min = 0, max = 100,value=50, style="slider") threshold

//------SETUP ImageJ/Java PACKAGES-----//
importClass(Packages.ij.IJ);
importClass(Packages.ij.ImagePlus);
importClass(Packages.ij.ImageStack);
importClass(Packages.ij.Prefs);
importClass(Packages.ij.WindowManager);
importClass(Packages.ij.gui.GenericDialog);
importClass(Packages.ij.gui.Overlay);
importClass(Packages.ij.gui.ProfilePlot);
importClass(Packages.ij.gui.Roi);
importClass(Packages.ij.io.Opener);
importClass(Packages.ij.io.OpenDialog);
importClass(Packages.ij.io.DirectoryChooser);
importClass(Packages.ij.macro.Interpreter);
importClass(Packages.ij.measure.Measurements);
importClass(Packages.ij.measure.ResultsTable);
importClass(Packages.ij.plugin.Duplicator);
importClass(Packages.ij.plugin.FolderOpener);
importClass(Packages.ij.plugin.filter.Analyzer);
importClass(Packages.ij.plugin.filter.ParticleAnalyzer);
importClass(Packages.ij.plugin.frame.PlugInDialog);
importClass(Packages.ij.plugin.frame.RoiManager);
importClass(Packages.ij.plugin.frame.ThresholdAdjuster);
importClass(Packages.ij.process.AutoThresholder);
importClass(Packages.ij.process.ImageConverter);
importClass(Packages.ij.process.ImageProcessor);
importClass(Packages.ij.process.ImageStatistics);
importClass(Packages.ij.util.ArrayUtil);
importClass(Packages.ij.util.Tools);
importClass(Packages.ij.util.WildcardMatch);
importClass(Packages.java.io.File);
importClass(Packages.java.io.FileFilter);
importClass(Packages.java.io.FilenameFilter);
importClass(Packages.java.io.IOException);
importClass(Packages.java.util.Arrays);
importClass(Packages.java.util.Collections);
importClass(Packages.java.util.HashMap);
importClass(Packages.java.util.List);
importPackage(java.awt);

//------INITIALIZE OBJECTS-----//
//IJ = new IJ(); 
RM = new RoiManager(true);// initiating the ROI manager in hidden mode.
MACRO = new Interpreter(); 
AT = new AutoThresholder();
//TA = new ThresholdAdjuster();
AN = new Analyzer();
PA = new ParticleAnalyzer();

PREF = new Prefs();
WM = new WildcardMatch();
OF = new Opener();
OD = new FolderOpener();
RT = new ResultsTable();
IS = new ImageStatistics();
RT.setNaNEmptyCells(true); 

if (RM==null){ IJ.error("ROI Manager is not found"); }
MACRO.batchMode = false; // activate batchmode (= setBatchMode(true) in IJ macro)
PREF.blackBackground = true;
FS = PREF.separator;
IJ.log("File separator:"+FS);


//------CUSTOM FUNCTIONS-----//
function getImages(Filelist){
	var ImgArray = new Array();
	for(var f=0;f<Filelist.length;f++){
		var file = new File( Filelist[f] );
		var imp  = IJ.openImage( file );
		ImgArray.push(imp);
	}
	return(ImgArray);
}

function findPattern(strings,pattern){
	var found = new Array();
	for( var i=0; i<strings.length; i++){
		var matched = WM.match(strings[i],"*"+pattern+"*");
		found.push(matched);
	}
	return(found);
}

function bool2idx(logical,invert){
	var idx = new Array();
	for(var l=0; l<logical.length; l++){
		if( logical[l] === invert ){ idx.push(l); }
	}
	return(idx);
}

function getIndex(Arr,Ind){
 	if( Arr.length < Ind.length ){ IJ.error("Array too short or too many indexes"); throw 'Out Of Bounds'; }
 	var sliced = new Array();
 	for(var i=0; i<Ind.length; i++){ sliced.push(Arr[Ind[i]]); 	}
 	return(sliced);
}

function getMatch(strings,pattern){
	var found=findPattern(strings,pattern);
	var matched = getIndex(strings,bool2idx(found,true));
	return(matched);
}

function getUnmatch(strings,pattern){
	var found=findPattern(strings,pattern);
	var unmatched = getIndex(strings,bool2idx(found,false));
	return(unmatched);
}


function mapArray(fn,Arr) {
	var Arr2 = new Array();
	for (var i = 0; i < Arr.length; i++){ Arr2.push(fn(Arr[i])); }
	return Arr2;
}


// Get statistical measurements using a method that takes an array as an input
// (max,min,range,midrange,sum,mean,median,variance,standard deviation, mean absolute deviation, zscore)
// Usage : ex. var mean = arr.mean(myArray);
var arr = {	
	max: function(array) {
		return Math.max.apply(null, array);
	},
	
	min: function(array) {
		return Math.min.apply(null, array);
	},
	
	range: function(array) {
		return arr.max(array) - arr.min(array);
	},
	
	midrange: function(array) {
		return arr.range(array) / 2;
	},

	sum: function(array) {
		var num = 0;
		for (var i = 0, l = array.length; i < l; i++) num += array[i];
		return num;
	},
	
	mean: function(array) {
		return arr.sum(array) / array.length;
	},
	
	median: function(array) {
		array.sort(function(a, b) {	return a - b; });
		var mid = array.length / 2;
		return mid % 1 ? array[mid - 0.5] : (array[mid - 1] + array[mid]) / 2;
	},
	
	variance: function(array) {
		var mean = arr.mean(array);
		return arr.mean(mapArray(function(num) { return Math.pow(num - mean, 2) }, array));
	},

	sd: function(array) {
		return Math.sqrt(arr.variance(array));
	},
	
	meanAbsoluteDeviation: function(array) {
		var mean = arr.mean(array);
		return arr.mean(mapArray(function(num) { return Math.abs(num - mean) },array));
	},
	
	zScores: function(array) {
		var mean = arr.mean(array);
		var standardDeviation = arr.sd(array);
		return mapArray(function(num) { return (num - mean) / standardDeviation; }, array);
	}
};

function MakePixelList() {
// Create a new object storing a pixel list containing 3 arrays for x/y coordinates and intensity of each pixel
  this.L = 0;
  this.N = "";
  this.I = new Array();
  this.X = new Array();
  this.Y = new Array();
}

function getpxROI(imp,roi){
  	imp.setRoi(roi,false);
  	var ip = imp.getProcessor();
  	ip.setRoi(roi);

  	var PX = new MakePixelList();
  	var mask = roi!=null?roi.getMask():null;
  	if (mask==null){ IJ.error("Non-rectangular ROI required"); }
  	var r = roi.getBounds();

  	for (var y=0; y<r.height; y++) {
	  	for (var x=0; x<r.width; x++) {
	   		if (mask.getPixel(x,y)!=0){
				PX.L++;
				PX.X.push(r.x+x);
				PX.Y.push(r.y+y);
        		PX.I.push(ip.getf(r.x+x,r.y+y));
	   		}
    	}
	}
	return(PX);
}

function ThresholdROI(px2d,thr){

	var nThr=0; // nb values below threshold
	var pxthr = new MakePixelList();

	for( var i = 0; i < px2d.L; i++){ // loop over all pixels
		if( px2d.I[i] < thr ){ // count how many pixel had intensities below threshold
			nThr++;
		}else{
			// Keep intensities values above threshold
    		pxthr.I.push(px2d.I[i]);
			pxthr.L++;
			pxthr.X.push(px2d.X[i]);
			pxthr.Y.push(px2d.Y[i]);
		}
	}

	//IJ.log("Remanining pixels: "+pxthr.L+" ("+nThr+" pixels  below "+thr+")");
	return pxthr;
}


function getPercentile(Percentile,PixArray){
	var N = PixArray.length;
	PixArray.sort(function(a,b){ return(a-b) }); 
    var rank = Math.round((Percentile/100)*(N+1));
    if(Percentile==100){ rank = N - 1;	}
    return PixArray[rank];
}

function getDeciles(PixArray){
	var binInt = new Array(11);
	for( var b=0; b < binInt.length; b++){
		d = 100 - (b*10);
		binInt[b] = getPercentile(d,PixArray);
	}
	return(binInt);
}

function getROI(imp){
 	var O = imp.getOverlay(); 
	IJ.redirectErrorMessages(true);
	if (O == null) { IJ.error("ERROR","No cells were segmented."); }
	else{ IJ.log("    "+O.size() + " cells were found."); }
	IJ.redirectErrorMessages(false);
	return(O)
}

function initMeasure(){
	var Measurements = new HashMap();
	Measurements.put('XM',"xCenterOfMass");
	Measurements.put('YM',"yCenterOfMass");
	Measurements.put('H',"roiHeight"); 
	Measurements.put('W',"roiWidth");
	Measurements.put('area',"pixelCount");
	Measurements.put('avg',"mean");
	Measurements.put('sd',"stdDev");
	Measurements.put('med',"median");
	Measurements.put('min',"min");
	Measurements.put('max',"max");
	Measurements.put('mode',"mode");
	return(Measurements)
}

function FilterFilenames(Filelist,filter,exclude){
	// Get strings matched by pattern
	var MATCHED= getMatch(Filelist,filter);
	IJ.log(" "+MATCHED.length+" names WITH '"+filter+"'");
	
	if( exclude !== null ){
		// Get strings NOT matched by pattern
		MATCHED= getUnmatch(MATCHED,exclude);
		IJ.log(" ->"+MATCHED.length+" WITHOUT '"+exclude+"'");
	}
	
	// return a array of string with matched filenames
	return(MATCHED)
}

function listFiles(path){
	var DIR = new File(path);
	//Verify if it is a valid file name
   	if(!DIR.exists()){ IJ.error("'"+path+"' does not exist."); throw 'Path Not Found'; }
	//Verify if it is a directory and not a file path
	if(!DIR.isDirectory()){ IJ.error("Directory '"+path+"' does not exist."); throw 'Not A Directory'; }   	
	
	IJ.log("Directory : "+DIR.getCanonicalPath());
	// List filenames as array of string
	var FILELIST = Java.from(DIR.list()).sort();
	IJ.log("Total number of files: " +FILELIST.length);
	return(FILELIST);
}

function addZero(i) {
  if (i < 10) {  i = "0" + i; }
  return i;
}


ROOT="/media/elusers/users/benjamin/A-PROJECTS/01_PhD/04-image-analysis/HSG-mayor/Aug2019-Colocalization-SD/yeastspotter_output/"
//------USER INPUT-----//
OUTPUT = new File(ROOT+"OUT_CSV/");

var SAVE_CSV=true; // SAVE MEASUREMENTS ON SEGMENTED CELLS
// Colnames of the results file for the measurements
var cols = new Array('XM','YM','H','W','area','avg','sd','med','min','max','mode');

//------PROCESSING------//
var start = new Date();
var start_time = addZero(start.getHours()) + ":" + addZero(start.getMinutes()) + ":" + addZero(start.getSeconds());
IJ.log("Start Time "+start_time);
IJ.log("=============");

// Show defaults parameters
var Measures = initMeasure();
var colnames = Measures.keySet().toArray();
var fields = Measures.values().toArray();
IJ.log("Statistics measured are :"+Arrays.toString(fields));
IJ.log("Corresponding CSV column names will be: "+Arrays.toString(colnames));
IJ.log("CSV files will be saved in: "+OUTPUT.toString());

if (!OUTPUT.exists() && !OUTPUT.isDirectory()){
	if(OUTPUT.mkdirs()){ IJ.log("Directory for CSV files was successfully created!"); }
	OUTPUT = new File(IJ.getDirectory('home')+"/ROI2CSV/");
	if(OUTPUT.mkdirs()){ IJ.log("Could not find/create CSV directory. Default to : "+OUTPUT.getCanonicalPath()); }
}


// Reading input parameters
IJ.log("");
IJ.log("1. Get files from Image Directory");
var IMG = listFiles(IMGDIR);
IJ.log("");
IJ.log("2. Filter filenames matching chanel pattern");
var SEG = FilterFilenames(IMG,CSEG,"DIC");
FROM=0;
TO=SEG.length;
var FL1 = FilterFilenames(IMG, C1, null);
IJ.log("");


function getSegmentation(file,path){
	var F = new File (path+"/"+file);
	//IJ.log("seg="+F.getName());
	var IMG = IJ.openImage(F);
	var IP = IMG.getProcessor();
	var OVERLAYS = getROI(IMG);
	return(OVERLAYS);
}

function getFluorescent(file,path,C){
	var F = new File (path+"/"+file);
	//IJ.log("C"+C+"="+F.getName());
	var IMG = IJ.openImage(F);
	return(IMG);
}




// Processing directory of images
IJ.log("");
IJ.log("3. Get ROI with associated statistics for each image");
IJ.log("");
for(var S=FROM; S < TO; S++){
	var t0=new Date().getTime();
	// Reinitialize ROI manager in hidden mode and close all open windows
	RM.reset();
	IJ.run("Close All", "");

	var seg = SEG[S];
	IJ.log(" File no. "+(S+1)+"/"+TO);
	
	var OV = getSegmentation(SEG[S],IMGDIR.getCanonicalPath());
	if( OV == null ) { continue ; }
	var FL = getFluorescent(FL1[S],IMGDIR.getCanonicalPath(),1);

	var measurements = Analyzer.getMeasurements();
	RM.setOverlay(OV);
	var table = RM.measure();
	
	IJ.log("    Save cell statistics to CSV file: '" + FL1[S] +".csv'");
	for( var o=0; o<OV.size(); o++ ){
		var CELL = OV.get(o);
		FL.setRoi(CELL,true);
		FL.getProcessor().setRoi(CELL);
        //var stats = FL.getProcessor().getStatistics(); 
        
		//var MED = ImageStatistics.getStatistics(FL.getProcessor(), Measurements.MEDIAN, FL.getCalibration());
		//var roistats = FL.getStatistics(Measurements.ALL_STATS);
		//print(roistats.circularity);
        
        var px2D = getpxROI(FL,CELL);
        var thr = getPercentile(threshold,px2D.I);
        var bins = getDeciles(px2D.I,0);
		var thresholded = ThresholdROI(px2D, thr);
		
		//RT.setValue( 'cell', o,  o+1 );
        //for( var k=0; k<cols.length; k++){
        	//IJ.log(k + ". " + cols[k] + " : " + Measures[ cols[k] ] + " value : "+Math.round(stats[ Measures[ cols[k] ] ]) ); 
       	//	RT.setValue( cols[k], o,  stats[Measures[ cols[k] ]] );
       	//}

		table.setValue( "npix.q"+threshold, o,  thresholded.L );
		table.setValue( "mean.q"+threshold, o,  arr.mean(thresholded.I) );
		table.setValue( "median.q"+threshold, o,  arr.median(thresholded.I) );
		table.setValue( "sd.q"+threshold, o,   arr.sd(thresholded.I) );
		table.setValue( "min.q"+threshold, o,  arr.min(thresholded.I) );
		table.setValue( "max.q"+threshold, o,  arr.max(thresholded.I) );

		for( var b=0; b < bins.length; b++){
			//IJ.log("bins "+b+": "+bins[b]); 
			if( bins[b] !== undefined ){ table.setValue(C1+"_int_b"+b,o,bins[b]);  }
		}
    }
	
	CSVFILE = OUTPUT.getCanonicalPath() + "/" + FL1[S] + ".csv";
	//IJ.log(CSVFILE);
	table.save(CSVFILE);
	//RT.saveAs(CSVFILE);
	RT.reset();
	var t1=new Date().getTime();
	var dt = t1-t0;
	IJ.log("    [DONE] TOOK "+ Math.round(dt/1000) + "s.");
	IJ.log("")
}
RM.reset();
IJ.run("Close All", "");
var end = new Date();
var end_time = addZero(end.getHours()) + ":" + addZero(end.getMinutes()) + ":" + addZero(end.getSeconds());
IJ.log("")
IJ.log("==============");
IJ.log("End Time : "+end_time);

IJ.log("              ");
var total_time= end.getTime() - start.getTime();
IJ.log("TOTAL TIME TAKEN FROM IMAGE " + (FROM+1) + " TO " + (TO-1) + " : " + Math.round( (total_time/1000) ) + " sec " );
IJ.log("AVERAGE TIME PER IMAGE: "+ Math.round((total_time/TO) / 1000) + "sec");