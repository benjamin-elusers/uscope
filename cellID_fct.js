importClass(Packages.ij.IJ);
importClass(Packages.ij.plugin.frame.RoiManager);
importClass(Packages.ij.io.OpenDialog);
importClass(Packages.ij.io.DirectoryChooser);
importClass(Packages.java.io.File);
importClass(Packages.ij.gui.GenericDialog);
importClass(Packages.ij.util.Tools);
importClass(Packages.ij.plugin.Duplicator);
importClass(Packages.ij.measure.ResultsTable);
importClass(Packages.ij.ImagePlus);
importClass(Packages.ij.process.ImageProcessor);
importClass(Packages.ij.util.ArrayUtil);
importClass(Packages.ij.gui.Overlay);
importClass(Packages.ij.plugin.filter.ParticleAnalyzer);
importClass(Packages.ij.gui.Roi);
importClass(Packages.ij.plugin.filter.Analyzer);
importClass(Packages.ij.plugin.RGBStackMerge);
importClass(Packages.ij.process.ImageConverter);
importClass(Packages.ij.gui.OvalRoi);
importClass(Packages.ij.WindowManager);
importClass(Packages.ij.ImageStack);
importClass(Packages.ij.gui.ProfilePlot);
importClass(Packages.ij.gui.Line);
importClass(Packages.ij.gui.Plot);
importClass(Packages.ij.measure.CurveFitter);
importClass(Packages.ij.plugin.frame.Fitter);
importClass(Packages.ij.gui.PolygonRoi);
importClass(Packages.ij.process.ImageStatistics);
importClass(Packages.ij.measure.Measurements);
importClass(Packages.ij.plugin.ZProjector);
importClass(Packages.ij.gui.ShapeRoi);
importClass(Packages.ij.gui.TextRoi);
importClass(Packages.java.lang.System);
importClass(Packages.ij.ImageJ);
importPackage(java.awt);


function myROI(nflCh,nbfCh) { 
// Constructor for any type of ROI. Takes 2 arguments - the first one is the number of fluorescent channels and the second one is the number of brightfield channels. 
    var verb = 4;
    if(verb > 4){
    	IJ.log("There will be three fields for storing sub-cellular objects: origsubFoci for the foci segmented by ImageJ, ovalsubFoci for the oval ROIs, and polygsubFoci for the polygon foci.");
    }
    var subOrigFld = "origsubFoci";
	var subOvalFld = "ovalsubFoci";
	var subpolyFld = "polygsubFoci";
    this.nflCh = nflCh; 
    this.nbfCh = nbfCh;
    if(verb > 4){
    	IJ.log("Constructing the ROI object. The number of fluorescent channels is: " + nflCh + " , and the number of brightfield channels is: " + nbfCh);
    	IJ.log("Two median fluorescence arrays will be formed for the ROI - one for the brightfield images and the other for the fluorescent channel.");
    }
    this.ROIobj = null; // ImageJ's Roi type object corresponding to this Roi.
    this.area = null;
    this.x = null;
    this.y = null;
    this.medianfl = new Array(nflCh); // The median fluorescence of the cell values - channel images
    this.medianbf = new Array(nbfCh); // The median fluorescence of the cell values - brightfield images
    this.meanfl = new Array(nflCh);
    // These bins are calculated according to the percentile of the sorted gravalues/
    this.bin0fl = new Array(nflCh); // The brightest pixel
    this.bin1fl = new Array(nflCh); 
    this.bin2fl = new Array(nflCh); 
    this.bin3fl = new Array(nflCh); 
    this.bin4fl = new Array(nflCh); 
    this.bin5fl = new Array(nflCh);
    this.bin6fl = new Array(nflCh); 
    this.bin7fl = new Array(nflCh); 
    this.bin8fl = new Array(nflCh); 
    this.bin9fl = new Array(nflCh); 
    this.bin10fl = new Array(nflCh); // The darkest pixel

    // Now, for bins divided equally according to a range of grayvalues: (the first bin starts from 0 to 1/5 of the grayvalue range, etc.)
    this.gryLvlBin1bf = new Array(nbfCh);
    this.gryLvlBin2bf = new Array(nbfCh);
    this.gryLvlBin3bf = new Array(nbfCh);
    this.gryLvlBin4bf = new Array(nbfCh);
    this.gryLvlBin5bf = new Array(nbfCh);
    this.BinRatio = new Array(nbfCh);
    
    this.type = null;
    this.setROIcol = function (strCol) {
    	// Takes one of the following strings as an argument: "yellow","orange","red","blue","white","green" or "black" and sets the cell ROI object to the selected color.
    	// I made a color map in javascript, since the Java API color static fields are not available from Rhino Javascript, but the Java color object constructor is.
    	// It is possible to add a new color by copying the following line: colorMap["black"] = [0,0,0]; and changing the name of the color to a selected color name and a corresponding 
    	// set of RGB values by looking up the values in the link I provided. 
    	clr = new Color(0, 1, 0); // I need to have a color object.
    	var colorMap = {};
		// Add keys to the hashmap - more colors can be found here: http://www.avatar.se/molscript/doc/colour_names.html
		if(verb > 4){IJ.log("Choose a string color from: yellow, orange, red, blue, white, green and black");}
		colorMap["yellow"] = [1,1,0];
		colorMap["orange"] = [1,0.647,0];
		colorMap["red"] = [1,0,0];
		colorMap["blue"] = [0,0,1];
		colorMap["white"] = [1,1,1];
		colorMap["green"] = [0,1,0];
		colorMap["black"] = [0,0,0];
		
		var clrComp = new Array();
		for(var i=0; i<3; i++){
			clrComp[i] = colorMap[strCol][i];
		}
		chooseClr = new Color(colorMap[strCol][0], colorMap[strCol][1], colorMap[strCol][2]);
		
		this.ROIobj.setStrokeColor(chooseClr);
    }
	this[subOrigFld] = new Array();
    for(var k=0;k<this.nflCh;k++){ 
		this[subOrigFld][k] = new Array();
	}
	this[subOvalFld] = new Array();
    for(var k=0;k<this.nflCh;k++){ 
		this[subOvalFld][k] = new Array();
	}
	this[subpolyFld] = new Array();
	for(var k=0;k<this.nflCh;k++){ 
		this[subpolyFld][k] = new Array();
	}
    this.toString = function () {
		IJ.log("nflCh: " + this.nflCh + "nbfCh: " + this.nbfCh + " , " + " ROIobj: " + this.ROIobj + " , area: " + this.area + " , xVal: " + this.x + " , yVal: " + this.y + " , medianfl: " + this.medianfl + " , medianbr: " + this.medianbf + " , " + " type: " + this.type); 
    }
}


function myImg() { 
    // Constructor for the image object. Takes 3 arguments - the first one is the number of fluorescent channels, the second one is the number of brightfield channels and 
    // the third one is the input directory. 
    nflCh = STATIC_FLCHANNELS.length;
    nbfCh = STATIC_NBRCH;
    verb = 4;
    if(verb > 4){
    	IJ.log("Constructing the image object. The number of fluorescent channels is: " + nflCh + " and the number of brightfield channels is: " + nbfCh);
    }
    this.nflCh = nflCh; 
    this.nbfCh = nbfCh;
    this.chstr = new Array(nflCh); // The last part of the channel name after the "-" in the FLCHANNELS array specified by the user.
    this.BGfl = new Array(nflCh); // Use this field later for background subtraction.
    this.BGbf = new Array(nbfCh); // Use this field later for background subtraction.
    this.cellOvr = null;
    this.impfl = new Array(nflCh); // The fluorescent channel ImagePlus array
    this.impbf = new Array(nbfCh); // The brightfield ImagePlus array
    this.showCells = function (boolBF,arrIndx) {
    	if(boolBF){
    		this.impbf[arrIndx].setOverlay(this.cellOvr);
    		this.impbf[arrIndx].show();
    	}
    	else{
    		this.impfl[arrIndx].setOverlay(this.cellOvr);
    		this.impfl[arrIndx].show();
    	}
    }
        this.saveflCells = function (inCH,toCH,cellArr,strName) {
    	// Takes : inCH - the channel index used for segmenting the foci, toCH - the channel index used to overlay the foci, and the current cell object,
    	// and displays the cell and the inCH segmented polygon foci on the toCH overlay channel.
    	var prevOvr = this.impfl[toCH].getOverlay();
    	if(prevOvr != null){prevOvr.clear()};
    	var celfocOvr = new Overlay();
    	for(var roi=0;roi<cellArr.length;roi++){
	    	var cellRoiobj = cellArr[roi].ROIobj;
			cellRoiobj.setStrokeColor(Color.blue); // initializing the color of the cells to orange, which is a general color that only means it's a cell.
	    	celfocOvr.add(cellArr[roi].ROIobj);
	    	if(verb > 4){
	    		IJ.log("Added a cell Roi of length: " + cellArr[roi].ROIobj.getLength());
	    	}
			for(subFoc=0; subFoc < cellArr[roi].polygsubFoci[inCH].length ; subFoc++){
				var fociRoi = cellArr[roi].polygsubFoci[inCH][subFoc].ROIobj;
				fociRoi.setStrokeColor(Color.green);
				celfocOvr.add(cellArr[roi].polygsubFoci[inCH][subFoc].ROIobj);
				if(verb > 4){
					IJ.log("Added a yellow foci Roi of length: " + cellArr[roi].polygsubFoci[inCH][subFoc].ROIobj.getLength());
				}
		    }
    	}
		this.impfl[toCH].setOverlay(celfocOvr);
		IJ.saveAs(this.impfl[toCH], "Tiff", strName);
    }
    this.showflCell = function (inCH,toCH,currentCell) {
    	// Takes : inCH - the channel index used for segmenting the foci, toCH - the channel index used to overlay the foci, and the current cell object,
    	// and displays the cell and the inCH segmented polygon foci on the toCH overlay channel.
    	var prevOvr = this.impbf[toCH].getOverlay();
    	if(prevOvr != null){prevOvr.clear()};
    	var celfocOvr = new Overlay();
    	celfocOvr.add(currentCell.ROIobj);
    	
		for(subFoc=0; subFoc < currentCell.polygsubFoci[inCH].length ; subFoc++){
			celfocOvr.add(currentCell.polygsubFoci[inCH][subFoc].ROIobj);
	    }
		this.impfl[toCH].setOverlay(celfocOvr);
		this.impfl[toCH].show();
    }
    this.showbfCell = function (currentROI,arrIndx) {
    	// Takes the current cell ROI or any other ROI object and the brightfield array index.
    	// Displays the cell on the selected brightfield channel.
    	// It can work on any ROI - it does not need to be a cell.
    	var prevOvr = this.impbf[arrIndx].getOverlay();
    	if(prevOvr != null){prevOvr.clear()};
    	var celfocOvr = new Overlay();
    	celfocOvr.add(currentROI);
		this.impbf[arrIndx].setOverlay(celfocOvr);
		this.impbf[arrIndx].show();
    }
    
    
    this.toString = function () {
		IJ.log("nflCH: " + this.nflCh + " , " + "nbfCh: " + this.nbfCh); 
		for(var i = 0; i < this.nflCh; i++){ // Make 2 fields - flCh and bfCh
			IJ.log("BGfl: " + this.BGfl[i] ); 
		}
		for(var i = 0; i < this.nbfCh; i++){ // Make 2 fields - flCh and bfCh
			IJ.log("BGbf: " + this.BGbf[i]); 
		}
    }	    
}


function filename_parts(fileList){ // essential for the foci script
	// Takes fileList, which is an array of filenames (all the files in the folder) - including their paths. It returns an array called filenameParts.
	// The first array member in filenameParts is procNameList, which is the list of output images from the segmentation program. (their name ends with procstk.tif)
	// The second array member is basenameprocList, which is a list of basenames. The basename is the part of the image name which comes before -w#cf. 
	// The third array member is sNumprocList, which is a list of snums. An snum is the part of the filename that is: s# or t#.
	var verb = 4;
	var filenameList = new Array();
	var procNameList = new Array();
	var basenameprocList = new Array();
	
	var numfromSNUM = new Array();
	var sNumprocList = new Array();
	for (var k = 0; k < fileList.length; k++) { // The filenames include the path.
		var stringArg = ""+fileList[k];
		if(verb > 4){IJ.log("When fileList is converted to string, it is: " + stringArg);}
		if(stringArg.match(/^(.*)\/([^\/]+(t|s)(i|t)(f|k))$/)){
			var filename = RegExp.$2;
			if(verb > 4){IJ.log("The filename is: " + filename);}
			filenameList.push(filename);
			// This was Emmanuel's original reg. exp., which I changed to match only the proc file.
			    //if(filename.match(/^(.*)_(w[0-9][^_]+)_([st][0-9]+)([^0-9]{0,1}[0-9]{0,4}[a-z]{0,4})\.([a-zA-Z]+)$/)){
			if(filename.match(/^(.*)_(w[0-9][^_]+)_([st][0-9]+)([^0-9]{0,1}[0-9]{4}[a-z]{7})\.([a-zA-Z]+)$/)){
			    // I want this expression to match the proc file that came from the segmentation program.
			    var basename  = RegExp.$1;
			    var channel   = RegExp.$2;
			    var snumber   = RegExp.$3;
			    var procname  = RegExp.$4;
			    if(verb > 4){
				    IJ.log(">>>>> basename: " + basename);
				    IJ.log(">>>>> channel: " + channel);
				    IJ.log(">>>>> snumber: " + snumber);
			    }
			    var procName = basename + "_" + channel + "_" + snumber + "-0001procstk.tif";
			    if(verb > 4){IJ.log(">>>>> Processing procName image: " + procName);}
			    procNameList.push(procName);
			    basenameprocList.push(basename);
			    sNumprocList.push(snumber);
		    }
	    }
	}
    var filenameParts = new Array;
    filenameParts[0] = procNameList;
    filenameParts[1] = basenameprocList;
    filenameParts[2] = sNumprocList;
    return filenameParts;
}


function openBFImps(procNameList,file_i){ // essential for the foci script
	// This function takes the input directory, the list of images whose names end with procstk.tif and a number between SKIP and UNTIL. 
	// It returns an array of brightfield ImagePluses - the first array member is the in-focus and the second one is the out of focus.
	var verb = 4;
	var channelImgTitle = new Array();
    var channelImp = new Array();
    var brightfieldImp = new Array();
    var channelImp8bit = new Array();
    var imgs = [];
    if(verb > 1){IJ.log(">>>>> Attempting to open image: " + STATIC_DIR+ procNameList[file_i] + " slice1");}
    var impProc = IJ.openImage(STATIC_DIR+ procNameList[file_i],1);
    var impProcTitle = impProc.getTitle();
    var impProcTitlenoTif = impProc.getShortTitle();
    var impProcnewTitle = impProcTitlenoTif + "-0001";
    impProc.setTitle(impProcnewTitle);
    if(verb > 4){IJ.log(">>>>> Attempting to open image: " + STATIC_DIR+ procNameList[file_i] + " slice2");} // This part is the bfCh
    brightfieldImp[0] = impProc;
    if(verb > 4){IJ.log(">>>>> Attempting to open out of focus image: " + STATIC_DIR+ procNameList[file_i] + " slice2");}
    var impOutofFoc = IJ.openImage(STATIC_DIR+ procNameList[file_i],2);
    var impOutofFocTitle = impOutofFoc.getTitle();
    if(verb > 4){IJ.log(">>>>> The out of focus title is: " + impOutofFocTitle);}
    var impOutofFocTitlenoTif = impOutofFoc.getShortTitle();
    if(verb > 4){IJ.log(">>>>> The out of focus title no tif is: " + impOutofFocTitlenoTif);}
    var impOutofFocnewTitle = impOutofFocTitlenoTif + "-0002";
    if(verb > 4){IJ.log(">>>>> The impOutofFocnewTitle is: " + impOutofFocnewTitle);}
    impOutofFoc.setTitle(impOutofFocnewTitle);
    if(verb > 4){IJ.log(">>>>> Attempting to save the out of focus imp.");}
    brightfieldImp[1] = impOutofFoc;
    return brightfieldImp;
}




function measureROI(roiObj,ip,imp,strStatsFld) { // essential for the foci script
	// Performs a measurement on an image. Takes as arguments: The roi object, the imageprocessor object, and the imagestatistics string field telling the function what to measure.
	// It returns the value that was measured.
	imp.setRoi(roiObj);
	ip.setRoi(roiObj);
	var stats = imp.getAllStatistics();
	//var stats = ip.getStatistics();
	var val = stats[strStatsFld];
    return val;
}



function toManager(currentCell,rm){ // essential for the foci script
    // This function takes the current cell object as an argument, and transfers the cell ROI object to the ROI manager. (because Analyze particles takes the ROIs from the manager)
    var verb = 4;
    if(verb > 4){IJ.log(">> Starting the toManager function.");}
    if (rm==null)
        IJ.error("> ROI Manager is not found in toManager"); 
		if(verb > 4){  IJ.log(" object: "+object + " will be added to the manager."); }        	
        rm.addRoi(currentCell.ROIobj);
    if(verb > 4){IJ.log(">> Finished running the toManager function.");}
}


function getROIQuantile(currentCell,ip,imp,CHnum,bgVal){ // essential for the foci script
	// This function takes an ROI object, the image processer object ,the image plus object and the factor times median value.
	// It returns an array: the first element in the returned array is isFoci, which tells us if there is a foci. If isFoci is 1, there are pixels brighter
	// than factor*median. If isFoci is 0, there are no pixels brighter than factor*median, so there are no foci in the cell.
	// The second element is the median intensity for this quantile range. 
	// The third element is the right threshold, needed for segmenting the foci.
	// The fourth element is the left threshold, also needed for segmenting the foci. 
	var isFoci = 0; // initializing
	var selROI = currentCell.ROIobj;
	var verb = 4;
	imp.setRoi(selROI, false);
	ip.setRoi(selROI);
	var stats = imp.getAllStatistics();
	var median = stats.median; // Adjusted median
	var mean = stats.mean;
	var counts = stats.histogram;
	var graylevels = new Array;
	var xMaxHist = stats.max;
	var xMinHist = stats.min;
	for (var i=0; i<counts.length; i++) {
		graylevels[i] = xMinHist+i*stats.binSize; 
	}
	var bgCorr = bgVal + 20*stats.binSize;
    var xMaxHist = stats.max; // Adjusted xMaxHist
    if(verb > 4){IJ.log(">>>> xMaxHist: " + xMaxHist);}
    if(verb > 4){
    	IJ.log("The median is: " + median);
   	    IJ.log("The factor is: " + STATIC_FACTORTIMESMEDIAN[CHnum] + " when CHnum is: " + CHnum);
    }
     // Checking if there are foci:
    var adjMedian = median - bgVal;
    var leftThresh = STATIC_FACTORTIMESMEDIAN[CHnum]*adjMedian + bgVal; // because I didn't really subtract the background from the images, I have to add the background value.
    if(leftThresh > xMaxHist){
    	isFoci = 0;
    	if(verb > 4){IJ.log("> There are no foci in the cell because leftThresh is higher than xMaxHist.");}
    }
    else if(adjMedian < 10){
    	adjMedian = 10;
    	var leftThresh = adjMedian + bgCorr; // This was Emmanuel's suggestion
    	if(leftThresh < xMaxHist){
    		isFoci =1;
    	}
    }
    else{
    	isFoci = 1;
    }
    var isFocThrsh = new Array();
    isFocThrsh.push(isFoci);
    isFocThrsh.push(xMaxHist);
    isFocThrsh.push(leftThresh);
    return isFocThrsh;
}

function fociSegmAndMeasure(ROInum,CHnum,currentCell,ip,imp,rm,bgVal){ // essential for the foci script
	// This function takes the cell index number, the channel number, the cell object array, the ImageProcessor object, the ImagePlus object,
	// the factor times mean variable and the Roi manager object. It checks if there are foci in the cell. If there are, it segments them. 
	// It adds the foci fields and objects to the cell array.
	var subOrigFld = "origsubFoci";
	var subOvalFld = "ovalsubFoci";
	var subpolyFld = "polygsubFoci";

    var verb = 4;
    
    if(verb > 4){IJ.log("Calling getROIQuantile for cell number: " + ROInum + " , and channel number: " + k + "from fociSegmAndMeasure.");}
    var isFociandThresh = getROIQuantile(currentCell,ip,imp,CHnum,bgVal);
    var isFoci = isFociandThresh[0];
	var rightThresh = isFociandThresh[1];
	var leftThresh = isFociandThresh[2];
	if(verb > 4){IJ.log("Returned from getROIQuantile, rightThresh is: " + rightThresh + " , and left thresh is: " + leftThresh);}
	rm.reset();
	toManager(currentCell,rm);
    //if((ROInum == 1) && (k==0)){
	//	IJ.log("Got all the way there.");
	//	throw new Error("Something went badly wrong!");
	//}
    if(isFoci){
		var nCells = rm.getCount();
		if(verb > 4){IJ.log("Before calling segmentPolygonFoci because isFoci is one, nCells is: " + nCells);}
		var Arr2DandCellobj = segmentPolygonFoci(ROInum,imp,ip,rm,k,currentCell,rightThresh,leftThresh); // The median should be obtained in a separate function.
		//throw new Error("Something went badly wrong!");
		var fociList = Arr2DandCellobj[0]; 
		var ovalfociList = Arr2DandCellobj[1];  
		var polygList = Arr2DandCellobj[2];

		polygList.sort(sortbyareafld); // sorts the polygon object array according to the area field, in descending order.
        if(verb > 4){IJ.log("~~~For object number: " + ROInum + " and channel: " + k +" , the fociList length is: " + fociList.length);}
		var currentCell = addsubFoci(subOrigFld,currentCell,fociList,k); // intermediate fields - not sorted by area, for debugging purposes 
		var currentCell = addsubFoci(subOvalFld,currentCell,ovalfociList,k); // intermediate fields - not sorted by area, for debugging purposes 
		var currentCell = addsubFoci(subpolyFld,currentCell,polygList,k);
    }
}


function getPercentile(Percentile,pixArr){ // essential for the foci script
	// This function takes a percentile value, an ROI object, the image processer object,the image plus object and the sorted pixel array.
	// It returns the corresponding grayvalue for the given percentile. If it's 50%, it will return the median gravalue.
	var verb = 4;
    var totInt = 0;
    var countPixels = 0;
    // Round to integer values:
    var N = pixArr.length;
    if(verb > 4){IJ.log("The pixel array length is: " + N);} 
    if(Percentile==100){
    	var iRank = N - 1;
    }
    else{
    	var iRank = Math.round((Percentile/100)*(N+1));
    }
    return pixArr[iRank];
}


function getAllPercentiles(currentCell,pixArr2){ // essential for the foci script
	// This function takes the current cell object and the sorted Roi pixel array.
	// It fills up the cell array fields for the fluorescence bins, from the 100th grayvalue percentile to the 0th percentile.
	var binsfl = new Array;
	selROI = currentCell.ROIobj;
	currentCell.bin0fl[k] = getPercentile(100,pixArr2); // The brightest pixel
    currentCell.bin1fl[k] = getPercentile(90,pixArr2);
	currentCell.bin2fl[k] = getPercentile(80,pixArr2);
	currentCell.bin3fl[k] = getPercentile(70,pixArr2);
	currentCell.bin4fl[k] = getPercentile(60,pixArr2);
	currentCell.bin5fl[k] = getPercentile(50,pixArr2); // The median 
	currentCell.bin6fl[k] = getPercentile(40,pixArr2);
	currentCell.bin7fl[k] = getPercentile(30,pixArr2);
	currentCell.bin8fl[k] = getPercentile(20,pixArr2);
	currentCell.bin9fl[k] = getPercentile(10,pixArr2);
	currentCell.bin10fl[k] = getPercentile(0,pixArr2); // The darkest pixel
}


function sortPixelArr(selROI,ip,imp){ // essential for the foci script
	// This function an ROI object, the image processer object and the image plus object.
	// It returns the sorted array in ascending order.
	var verb = 4;
	imp.setRoi(selROI, false);
	ip.setRoi(selROI);
	var stats = imp.getAllStatistics();
	var mean = stats.mean;
   
    var pixArr = new Array;
    var points = selROI.getContainedPoints()
    for(var p = 0; p < points.length; p++){
    var point = points[p];
    pixArr[p] = Math.round(ip.getf(point.x, point.y));
    }
    pixArr.sort(function(a, b){return a-b}); // Making sure that graylevels is sorted. (in ascending order - from low to high)
    return pixArr;
}



function sortArrayandIndex(array1){ // essential for the foci script
	// Takes an array as an argument and sorts it in ascending order. It returns the indexes with respect to the original array. 
    var verb = 4;
    if(verb >4){IJ.log(">> Started running the sortArrayandIndex function.");}
    var indexArray = new Array();
    for(var i=0;i<array1.length;i++){
    	indexArray[i] = i;
    }
    for (var i = 0; i < array1.length; i++){
        for (var j = i + 1; j < array1.length; j++){
            if (array1[i] > array1[j]){
                var temp = array1[j];
                array1[j] = array1[i];
                array1[i] = temp;

                var tempIndex = indexArray[j];
                indexArray[j] = indexArray[i];
                indexArray[i] = tempIndex;
            }
        }
     }
     if(verb > 4){IJ.log(">> Finished running the sortArrayandIndex function.");}
     return indexArray;    
}


// cell2result EDL
// takes a cell object, the number of subobjects to print
// returns a string with stats


function measureBF(ROInum,i,currentImg,imp,ip,currentCell){ // essential for the foci script
    // Accepts the cell index, an integer between 0 and the number of brightfield images, and ImagePlus object, an ImageProcessor object and the cell array.
    // It measures and saves the 5 brightfield bin values and the bin ratio and adds these fields to the cell objects.
    var imp = currentImg.impbf[i];
    var ip = imp.getProcessor();
    imp.setRoi(currentCell.ROIobj);
    ip.setRoi(currentCell.ROIobj);
	var statsVal = imp.getAllStatistics();
	currentCell.medianbf[i] = statsVal.median;
	var binsAndbinRatio = histFiveBins(currentCell.ROIobj,imp);
	currentCell.gryLvlBin1bf[i] = binsAndbinRatio[0];
	currentCell.gryLvlBin2bf[i] = binsAndbinRatio[1];
	currentCell.gryLvlBin3bf[i] = binsAndbinRatio[2];
	currentCell.gryLvlBin4bf[i] = binsAndbinRatio[3];
	currentCell.gryLvlBin5bf[i] = binsAndbinRatio[4];
	currentCell.BinRatio[i] = binsAndbinRatio[5];
    
	
	if(verb > 4){
    	IJ.log("For cell: " + ROInum + " and brightfield channel: " + i + " the median intensity is: " + currentCell.medianbf[i]);
    	IJ.log("newBin1: " + currentCell.gryLvlBin1bf[i]);
    	IJ.log("newBin2: " + currentCell.gryLvlBin2bf[i] + " , newBin3: " + currentCell.gryLvlBin3bf[i]);
    	IJ.log("newBin4: " + currentCell.gryLvlBin4bf[i] + " , newBin5: " + currentCell.gryLvlBin5bf[i]);
	}
}



function measureFoci_OvrCH_indp(currentImg,ROInum,imp,ip,currentCell,inch){ // essential for the foci script
    // Accepts the current image object, the cell index, the ImagePlus object, the ImageProcessor object, the cell array and the inch channel. (the channel no. of the channel the segmentation was performed on)  
    // it measures all of the foci related values that are independent of the channel the image is overlayed on and saves the foci related values into the cell array foci related fields.
    var verb = 4;
    if(currentCell.polygsubFoci.length > 0){
		for( var focinumber=0; focinumber<currentCell.polygsubFoci[inch].length; focinumber++){
			currentCell.polygsubFoci[inch][focinumber].area = measureROI(currentCell.polygsubFoci[inch][focinumber].ROIobj,ip,imp,"area");
			if(verb > 4){
				IJ.log("cell: " + ROInum + " , and foci: " + focinumber + " , inch: " + inch + " area: " + currentCell.polygsubFoci[inch][focinumber].area);
			}
			currentCell.polygsubFoci[inch][focinumber].x = measureROI(currentCell.polygsubFoci[inch][focinumber].ROIobj,ip,imp,"xCenterOfMass");
			currentCell.polygsubFoci[inch][focinumber].y = measureROI(currentCell.polygsubFoci[inch][focinumber].ROIobj,ip,imp,"yCenterOfMass");
			if(verb > 4){
				IJ.log("cell: " + ROInum + " , and foci: " + focinumber + " , inch: " + inch + " x: " + currentCell.polygsubFoci[inch][focinumber].x + " and y: " + currentCell.polygsubFoci[inch][focinumber].y);
			}
		}
    }
}



function measureFoci_OvrCH_dp(currentImg,ROInum,imp,ip,currentCell,inch,toch){ // essential for the foci script
    var verb = 4;
    if(currentCell.polygsubFoci.length > 0){
		for( var focinumber=0; focinumber<currentCell.polygsubFoci[inch].length; focinumber++){
			if(verb > 4){
				IJ.log("For cell: " + ROInum + " and inch channel: " + inch + " , and toch channel: " + toch + " and foci number: " + focinumber + " : ");
			}
		    imp.setRoi(currentCell.polygsubFoci[inch][focinumber].ROIobj);
		    ip.setRoi(currentCell.polygsubFoci[inch][focinumber].ROIobj);
			var focistatsVal = imp.getAllStatistics();
			currentCell.polygsubFoci[inch][focinumber].medianfl[toch] = focistatsVal.median;
			//currentCell.polygsubFoci[inch][focinumber].meanfl[toch] = focistatsVal.mean;
			if(verb  > 4){IJ.log("The median fluorescence value is: " + currentCell.polygsubFoci[inch][focinumber].medianfl[toch]);}
		}
    }
}



function cell2line(currentCell, ROInum, currentImg, rt){ // essential for the foci script
	// Takes the cell array and the cell index, the current image object and the results table object and adds a line corresponding to this cell
	// to the results object. It returns the updated results file.
	
	var brtfldLett = new Array(2);
	brtfldLett[0] = "I";
	brtfldLett[1] = "O";
	var cellnumPlus1 = ROInum + 1;
	rt.setValue("cell",ROInum,cellnumPlus1);
	rt.setValue("area",ROInum,currentCell.area);
	rt.setValue("x",ROInum,currentCell.x);
	rt.setValue("y",ROInum,currentCell.y);

    
    for(var i = 0; i< currentImg.nbfCh;i++){ // writing the median intensity values for the cells per fluorescent image.
        rt.setValue("BF" + brtfldLett[i] + "_lev_b1",ROInum,currentCell.gryLvlBin1bf[i]); 
        rt.setValue("BF" + brtfldLett[i] + "_lev_b2",ROInum,currentCell.gryLvlBin2bf[i]);
        rt.setValue("BF" + brtfldLett[i] + "_lev_b3",ROInum,currentCell.gryLvlBin3bf[i]);
        rt.setValue("BF" + brtfldLett[i] + "_lev_b4",ROInum,currentCell.gryLvlBin4bf[i]);
        rt.setValue("BF" + brtfldLett[i] + "_lev_b5",ROInum,currentCell.gryLvlBin5bf[i]);
       
    }

    for(var i = 0; i< currentImg.nflCh;i++){ // writing the median intensity values for the cells per brightfield image.
        rt.setValue(currentImg.chstr[i] + "_int_mean",ROInum,currentCell.meanfl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b0",ROInum,currentCell.bin0fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b1",ROInum,currentCell.bin1fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b2",ROInum,currentCell.bin2fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b3",ROInum,currentCell.bin3fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b4",ROInum,currentCell.bin4fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b5" ,ROInum,currentCell.bin5fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b6",ROInum,currentCell.bin6fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b7",ROInum,currentCell.bin7fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b8",ROInum,currentCell.bin8fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b9",ROInum,currentCell.bin9fl[i]);
        rt.setValue(currentImg.chstr[i] + "_int_b10",ROInum,currentCell.bin10fl[i]);
    }


    if(STATIC_SEGMENTFOCI){
	    for(var inch = 0; inch< currentImg.nflCh;inch++){ // writing the number of foci per cell per in_ch.
			rt.setValue("in" + currentImg.chstr[inch] + "nfoci",ROInum,currentCell.polygsubFoci[inch].length);
	
	        // writing the area and x,y values for the foci for each in_ch.
	        if(currentCell.polygsubFoci.length > 0){
				for( var focinumber=0; focinumber<2; focinumber++){
					if(focinumber<currentCell.polygsubFoci[inch].length){ // if the foci really exists
						var numPlus1 = focinumber + 1;
						rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "area",ROInum,currentCell.polygsubFoci[inch][focinumber].area);
						rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "x",ROInum,currentCell.polygsubFoci[inch][focinumber].x);
						rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "y",ROInum,currentCell.polygsubFoci[inch][focinumber].y);
				    }
				    else{ //Write zeros to make sure that the column headers will be the same regardless of the num of foci so that the R script will work
				    	var numPlus1 = focinumber + 1;
						rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "area",ROInum,0);
						rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "x",ROInum,0);
						rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "y",ROInum,0);
				    }
				}
	        }
	        
	        // writing the median intensity values for the foci.
		    for(var toch = 0; toch< currentImg.nflCh;toch++){
	            if(currentCell.polygsubFoci.length > 0){
					for(var focinumber=0; focinumber<2; focinumber++){
						if(focinumber<currentCell.polygsubFoci[inch].length){ // if the foci really exists
							var numPlus1 = focinumber + 1;
							rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "_to" + currentImg.chstr[toch] + "med",ROInum,currentCell.polygsubFoci[inch][focinumber].medianfl[toch]);
							//rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "_to" + currentImg.chstr[toch] + "mean",ROInum,currentCell.polygsubFoci[inch][focinumber].meanfl[toch]);
							                                                                                                                  
						}
						else{ // Write zeros to make sure that the column headers will be the same regardless of the num of foci so that the R script will work
							var numPlus1 = focinumber + 1;
							rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "_to" + currentImg.chstr[toch] + "med",ROInum,0);
							rt.setValue("f" + numPlus1 + "_in" + currentImg.chstr[inch] + "_to" + currentImg.chstr[toch] + "mean",ROInum,0);
						}
					}
	            }
	 	    }
	    }
    }
 


	// for each chanel -> median

	// for each ch (IN)
	//     for foci 1 to num 
	//           print area, 
	//           for each ch (TO)
	//
	return rt;
}



function segmentPolygonFoci(object,imp,ip,rm,CH,currentCell,rightThresh,leftThresh){ // essential for the foci script   
    // Takes the cell object, the image plus object, the image processor object, the ROI manager object, the segmentation-channel index number, the current Cell object, 
    // the right threshold and the left threshold. It returns an array: the first element in the returned array is the array of foci objects that were segmented using
    // Analyze, particles. The second array of foci objects is the oval ROIs generated by multiplying the width of the oval by 1.5, and the third array is
    // the final polygon foci objects. 
    var fociList = new Array();
    var ovalfociList = new Array();
    var polygList = new Array();
 	var verb = 4;
    if(verb > 4){
        IJ.log("At the beginning if segmentPolygonFoci");
        IJ.log(">> The left threshold based on the factor that will be used is: " + leftThresh);  
        IJ.log(">> The right threshold, based on the maximum threshold of the histogram is: " + rightThresh);  
    }
    IJ.setThreshold(imp, leftThresh, rightThresh);
    if(verb > 4){IJ.log(">>>> Segmenting the foci.");}
    var minFociSizeStr = STATIC_MINFOCISIZE + '';
    if(verb > 4){IJ.log(">>>> Will count the number of cells in the ROI manager.");}
    var AnalyzeStr = "size=" + minFociSizeStr + "-1800 pixel circularity=0.3-1.00 display add";
    var nObjectsb4Seg = rm.getCount();
    if(verb > 4){IJ.log("~The number of objects before the segmentation is: " + nObjectsb4Seg);}
    if(verb > 4){
    	IJ.log(">>>> The number of cells in the ROI manager is: " +nObjectsb4Seg );
    	IJ.log(">>>> Analyse particles will run with a min size of: " + minFociSizeStr + "and the rest of the settings for segmentation are: " );
    	IJ.log(">>>> The max size is 1800 pixels, circularity 0-1.00, show overlay, display, add the new particles to the ROI manager. ");
    }
    if(verb > 4){IJ.log("Before the segmentation, n is: " + nObjectsb4Seg);}
    IJ.run(imp, "Analyze Particles...", AnalyzeStr);
    //imp.show();
    //throw new Error("Something went badly wrong!");
    var nObjectsAfterSeg = rm.getCount();
    if(verb > 4){IJ.log("After the segmentation, n is: " + nObjectsAfterSeg);}
    var nFoci = nObjectsAfterSeg - nObjectsb4Seg;
    if(verb > 4){IJ.log(">>>> The number of foci is: " + nFoci);}
    if(nFoci == 0){
    	if(verb > 4){IJ.log(">>>> The number of foci in this cell is zero after Analyze, particles.");}
    }
    else{
    	if(verb > 4){
			IJ.log(">>> The number of foci in this cell is larger than zero. FociList will contain the indexes of polygon foci objects which will be created later in the ROI manager.");
    	}
    	if(verb > 4){IJ.log(">>>> Initializing the current cell object.");}
    	for(var fociNum = 0; fociNum < nFoci;fociNum++){
    		var selectedFociIndex = nObjectsb4Seg + fociNum;
    		if(verb > 4){IJ.log(">>>> Will select foci number: " + selectedFociIndex + " from the ROI manager.");}
    		rm.select(selectedFociIndex);
			if(verb > 4){IJ.log(">>>> Will get the ImageProcessor object.");}
			var ip = imp.getProcessor();
			if(verb > 4){IJ.log(">>>> Will get the selectedFociRoi from the manager.");}
			selectedFociRoi = rm.getRoi(selectedFociIndex); 
			if(verb > 4){IJ.log(">>>> Will set this foci ROI on the ImageProcessor object.");}
			fociList.push(selectedFociRoi);
			if(verb > 4){IJ.log(">>>> Will add to the fociList the foci that was segmented by ImageJ.");}
			imp.setRoi(selectedFociRoi);
			ip.setRoi(selectedFociRoi);
			if(verb > 4){IJ.log(">>>> Will creat an ImageStatistics object for the foci.");}
			var statsFoci = imp.getAllStatistics();
			//var statsFoci = ip.getStatistics();
			var fociHeight = statsFoci.roiHeight;
			if(verb > 4){IJ.log(">>>> FociHeight: " + fociHeight);}
			var fociWidth = statsFoci.roiWidth;
			if(verb > 4){
				IJ.log(">>>> FociWidth: " + fociWidth);
				IJ.log(" The median is: " + statsFoci.median); // delete after debugging
			}
			var fociAvgDiam = (fociHeight + fociWidth)/2;
			if(verb > 4){IJ.log(">>>> FociAvgDiam: " + fociAvgDiam);}
			var focixCentroid = statsFoci.xCentroid;
			var fociyCentroid = statsFoci.yCentroid;
			if(verb > 4){
				IJ.log(">>>> FocixCentroid: " + focixCentroid);
				IJ.log(">>>> FociyCentroid: " + fociyCentroid);
			}
			var topLeftX = focixCentroid - 0.5*fociWidth;
			var topLeftY = fociyCentroid - 0.5*fociHeight;
			var factorLargerthanFoci = 1.2;
			if(verb > 4){
				IJ.log(">>>> TopLeftX: " + topLeftX);
				IJ.log(">>>> TopLeftY: " + topLeftY);
				IJ.log(">>>> Will use these values to construct an ovalROI with the same centroid as the foci, but the diameter will be: " + factorLargerthanFoci + " times larger than the foci diameter.");
			} 
			var ovaltopLeftX = focixCentroid - 0.5*factorLargerthanFoci*fociWidth;
			var ovaltopLeftY = fociyCentroid - 0.5*factorLargerthanFoci*fociHeight;
			if(verb > 4){IJ.log(">>>> Will set the new oval ROI on the image.");}
			imp.setRoi(new OvalRoi(ovaltopLeftX,ovaltopLeftY,factorLargerthanFoci*fociWidth,factorLargerthanFoci*fociHeight));
			ip.setRoi(new OvalRoi(ovaltopLeftX,ovaltopLeftY,factorLargerthanFoci*fociWidth,factorLargerthanFoci*fociHeight));
			if(verb > 4){IJ.log(">>>> Adding the oval ROI to the ROI manager.");}
			ovalfociList.push(imp.getRoi());
			if(verb > 4){IJ.log(">>>> Selecting the oval ROI from the manager.");}
			var ip = imp.getProcessor();
			if(verb > 4){IJ.log(">>>> Will get the selectedFociRoi from the manager.");}
			imp.setRoi(imp.getRoi());
			ip.setRoi(imp.getRoi());
			if(verb > 4){IJ.log(">>>> Will create an ImageStatistics object for the foci.");}
			var statsOval = imp.getAllStatistics();
			//var statsOval = ip.getStatistics();
			var ovalxCentroid = statsOval.xCentroid;
			var ovalyCentroid = statsOval.yCentroid;
			if(verb > 4){
				IJ.log(">>>> ovalxCentroid: " + ovalxCentroid);
				IJ.log(">>>> ovalyCentroid: " + ovalyCentroid);
			}
			if(verb > 4){IJ.log(">>> Calling the makePolygon function.");}
			var returnedPoly = makePolygon(ovalfociList[fociNum],imp,leftThresh,currentCell);
			if(verb > 4){IJ.log("returnedPoly is the returned polygon ROI, or -1 if it was not added.");}
			var returnedType = typeof returnedPoly;
			var numType = typeof -1;
			if(returnedType != numType){
			    if(verb > 4){
					IJ.log("A polygon was formed, so the returned polygon will be added to the current cell object subROI field and also to the currentFoci ROIobj field.");
			    }
				currentFoci = new myROI(STATIC_FLCHANNELS.length);
				currentFoci.type = "foci";
				currentFoci.ROIobj = returnedPoly;
                polygList.push(returnedPoly);
				// Remove after quality control:
				
				var fociArea1 = measureROI(currentFoci.ROIobj,ip,imp,"area");
				if(verb > 4){IJ.log("####The area of foci number: " + fociNum + "in cell number: " + object + " is: " + fociArea1);}
			} 
			else{ 
				var numofFoci = nFoci - 1; // numofFoci is the updated number of foci, taking into account the fact that sometimes a polygon was not added.
				if(verb > 4){IJ.log("No polygon was formed. Will subtract this foci from nFoci.");}
			}
    	} // closes the for loop
	}
    if(verb > 4){IJ.log(">>>> The object number is: " + object);}
    IJ.resetMinAndMax(imp);
	if(verb > 4){IJ.log("#####Before the end of the important function, the length of fociList is: " + fociList.length);}
	var Arr2DandCellobj = new Array();
    Arr2DandCellobj.push(fociList);
	Arr2DandCellobj.push(ovalfociList);
	Arr2DandCellobj.push(polygList);
	
    return Arr2DandCellobj;
}


function makePolygon(selectedRoi,imp,leftThresh,currentCell){ // essential for the foci script
	// Takes an oval ROI, the image plus object, the left threshold, a boolean argument determining if the user wants to eliminate the crosstalk and the current cell object.
	// If a polygon ROI is formed, it returns it. Otherwise, it returns -1. 
	var minPolygArea = STATIC_MINPOLYGAREA;
	var minPolygCirc = STATIC_MINPOLYGCIRC;
	var verb = 4;
	if(verb > 4){
		IJ.log(">>>> Will get the ImageProcessor object.");
		IJ.log("makePolygon - at the beginning of this function, leftThresh is: " + leftThresh);
	}
	var ip = imp.getProcessor();
	if(verb > 4){IJ.log(">>>> Will set this ROI on the ImageProcessor object.");}
	imp.setRoi(selectedRoi);
	ip.setRoi(selectedRoi);
	if(verb > 4){IJ.log(">>>> Will creat an ImageStatistics object.");}
	var stats = imp.getAllStatistics();
	//var stats = ip.getStatistics();
	var xCentroid = stats.xCentroid;
	var yCentroid = stats.yCentroid;
	if(verb > 4){
		IJ.log(">>>> The xCentroid is: " + xCentroid);
		IJ.log(">>>> The yCentroid is: " + yCentroid);
	}
	var roiHeight = stats.roiHeight;
	var roiWidth = stats.roiWidth;
	if(verb > 4){
		IJ.log(">>>> The roiHeight is: " + roiHeight);
		IJ.log(">>>> ThroiWidth is: " + roiWidth);
	}
	var x1 = xCentroid - 0.5*roiWidth;
	var x2 = xCentroid + 0.5*roiWidth;
	var y1 = yCentroid + 0.5*roiHeight;
	var y2 = yCentroid - 0.5*roiHeight;
	if(verb > 4){
		IJ.log(">>>> x1 is: " + x1);
		IJ.log(">>>> y1 is: " + y1);
		IJ.log(">>>> x2 is: " + x2);
		IJ.log(">>>> y2 is: " + y2);
	}

	var startX = Math.floor(x1);
	var startY = Math.floor(yCentroid);
	var endX = x2;
	var endY = Math.floor(yCentroid);
	endX = startX + Math.round(endX - startX);
	endY = startY + Math.round(endY - startY);
	if(verb > 4){
		IJ.log(">>> The first line is parallel to the x-axis. The left point will be the first point on the polygon.");
		IJ.log(">>> The polygon points will go from 1-8 in a clockwise direction starting from the left-point which is parallel to x.");
		IJ.log(">>> The fifth polygon point will be on the line which is parallel to x.");
	}
	if(verb > 4){
		IJ.log(">>>> startX is: " + startX);
		IJ.log(">>>> startY is: " + startY);
		IJ.log(">>>> endX is: " + endX);
		IJ.log(">>>> endY is: " + endY);
	}
	if(verb > 4){IJ.log(">>> usePlotProfile will return the coordinates two points on the polygon that are parallel to the x-axis.");}
	
	var coordsParalleltoX = usePlotProfile(imp,startX, startY, endX, endY,leftThresh,currentCell);
	if(verb > 4){IJ.log(">>> Saving the coordinates of the points on the polygon that are parallel to the x-axis.");}
	var coordsOK = areCoordsOK(coordsParalleltoX,currentCell,imp);
    if(verb > 4){
		IJ.log(">>>> Checking if the coords obtained from usePlotProfile are in the cell. If not, the function will return false because it did not make a polygon.");
	}
	if(coordsOK == false){
		if(verb > 4){IJ.log("No polygon was formed - makePolygon will return minus one for cell number: " + currentCell.Indx);}
	return -1;
	}

    var polyPoint1X = coordsParalleltoX[0] + 0.5;
	var polyPoint1Y = coordsParalleltoX[1];
	var polyPoint5X = coordsParalleltoX[2]+0.5;
	var polyPoint5Y = coordsParalleltoX[3];

	var xCenter = coordsParalleltoX[4];
    var yCenter = coordsParalleltoX[5];

    xCenter = Math.round(xCenter) + 0.5;
	
	if(verb > 4){
		IJ.log(">>>> polyPoint1X is: " + polyPoint1X);
		IJ.log(">>>> polyPoint1Y is: " + polyPoint1Y);
		IJ.log(">>>> polyPoint5X is: " + polyPoint5X);
		IJ.log(">>>> polyPoint5Y is: " + polyPoint5Y);
		IJ.log(">>>> The new xCentroid is: " + xCenter);
		IJ.log(">>>> The new yCentroid is: " + yCenter);
	}
	// Parallel to y:

	startX = Math.round(xCenter);
	startY = Math.round(y1);
	endX = Math.round(xCenter);
	endY = y2;
	endX = startX + Math.round(endX - startX);
	endY = startY + Math.round(endY - startY);
	
	if(verb > 4){
		IJ.log(">>>> startX is: " + startX);
		IJ.log(">>>> startY is: " + startY);
		IJ.log(">>>> endX is: " + endX);
		IJ.log(">>>> endY is: " + endY);
	}
    if(verb > 4){
		IJ.log(">>>> The second line is parallel to the y-axis. ");
		IJ.log(">>>> Points number 3 and 7 on the polygon will be obtained from the usePlotProfile function.");
	}
    if(verb > 4){IJ.log(">>> usePlotProfile will return the coordinates of two points on the polygon that are parallel to the y-axis.");}
	
	var coordsParalleltoY = usePlotProfile(imp,startX, startY, endX, endY,leftThresh,currentCell);
	//throw new Error("Something went badly wrong!");
    var coordsOK = areCoordsOK(coordsParalleltoY,currentCell,imp);
	if(verb > 4){IJ.log(">>>> Checking if the coords obtained from usePlotProfile are in the cell. If not, the function will return false because it did not make a polygon.");}
    if(coordsOK == false){
		if(verb > 4){IJ.log("No polygon was formed - makePolygon will return minus 1 for cell number: " + currentCell.Indx);}
	return -1;
	}
	
	var polyPoint7X = coordsParalleltoY[0];
	var polyPoint7Y = coordsParalleltoY[1] + 0.5;
	var polyPoint3X = coordsParalleltoY[2];
	var polyPoint3Y = coordsParalleltoY[3] + 0.5;
	xCenter = coordsParalleltoY[4];
	yCenter = coordsParalleltoY[5];

	yCenter = Math.round(yCenter) + 0.5;
	
    if(verb > 4){
		IJ.log(">>>> polyPoint7X: " + polyPoint7X);
		IJ.log(">>>> polyPoint7Y: " + polyPoint7Y);
		IJ.log(">>>> polyPoint3X: " + polyPoint3X);
		IJ.log(">>>> polyPoint3Y: " + polyPoint3Y);
    }
	if(verb > 4){
		IJ.log(">>>> Here I calculate the coordinates of points that are along the oval diagonals, not necessarily in the right length.");
		IJ.log(">>>> The first oval diagonal direction will be from topLeft to bottomRight.");
		IJ.log(">>>> The second oval diagonal direction will be from bottomLeft to topRight.");
	}
	var topLeftDiagX = avg2nums(x1,xCentroid);
	var topLeftDiagY = avg2nums(y2,yCentroid);
	
	var topRightDiagX = avg2nums(x2,xCentroid);
	var topRightDiagY = avg2nums(y2,yCentroid);
	
	var bottomLeftDiagX = avg2nums(x1,xCentroid);
	var bottomLeftDiagY = avg2nums(y1,yCentroid);
	
	var bottomRightDiagX = avg2nums(x2,xCentroid);
	var bottomRightDiagY = avg2nums(y1,yCentroid);

	var diag1Slope = (bottomRightDiagY - topLeftDiagY)/(topRightDiagX - topLeftDiagX);
	if(verb > 4){IJ.log(">>>> Diag1s slope is: " + diag1Slope);}

	var diag2Slope = (bottomLeftDiagY - topRightDiagY)/(bottomLeftDiagX - topRightDiagX);
	if(verb > 4){IJ.log(">>>> Diag2s slope is: " + diag2Slope);}

    if(verb > 4){IJ.log(">>>> Now I will calculate the coordinates of points on the oval along the oval diagonals.");}
	var r = avg2nums(roiWidth,roiHeight)/2;
    var deltaXDiag1SQR = r*r/(1+diag1Slope*diag1Slope);
    var deltaXDiag1 = Math.pow(deltaXDiag1SQR, 0.5);
    var deltaYDiag1 = diag1Slope*deltaXDiag1;
	if(verb > 4){
		IJ.log(">>>> r: " + r + ", " + " deltaXDiag1SQR: " + deltaXDiag1SQR + " , " + "deltaXDiag1: " + deltaXDiag1 + "deltaYDiag1: " + deltaYDiag1);
		IJ.log(">>>> The third line is a diagonal from the top left side of the oval to the bottom right. ");
		IJ.log(">>>> Points number 2 and 6 on the polygon will be obtained from the plotProfile function.");
	}
	
	var startX_pixelNotCentered = xCentroid-deltaXDiag1;
	var startX = Math.floor(startX_pixelNotCentered);
	var startY_pixelNotCentered = yCentroid-deltaYDiag1;
	var startY = Math.floor(startY_pixelNotCentered);
	var endX_pixelNotCentered = xCentroid+deltaXDiag1;
	var endX = Math.floor(endX_pixelNotCentered);
	var endX_pixelNotCentered = yCentroid+deltaYDiag1;
	var endY = Math.floor(endX_pixelNotCentered);
 
    // Correcting the diagonal so that it would go through the center.

    var finishXY = findPointonVect(startX,startY,endX,endY,xCenter,yCenter,r);
    var beginXY = findPointonVect(endX,endY,startX,startY,xCenter,yCenter,r);
    startX = beginXY[0];
    startY = beginXY[1];
    endX = finishXY[0];
    endY = finishXY[1];
	
	if(verb > 4){
		IJ.log(">>>> startX: " + startX + ", " + "startY: " + startY + ", " + " endX: " + endX + ", " + " endY: " + endY);
		IJ.log(">>> usePlotProfile will return the coordinates two points on the polygon that are on the first diagonal, which goes from the top left to the bottom right.");
	}
	
	var coordsDiag1 = usePlotProfile(imp,startX, startY, endX, endY,leftThresh,currentCell);
	var coordsOK = areCoordsOK(coordsDiag1,currentCell,imp);
	if(verb > 4){IJ.log(">>>> Checking if the coords obtained from usePlotProfile are in the cell. If not, the function will return false because it did not make a polygon.");}
	if(coordsOK == false){
		if(verb > 4){IJ.log("No polygon was formed - makePolygon will return minus 1 for cell number: " + currentCell.Indx);}
		return -1;
	}
	var polyPoint2X = coordsDiag1[0] + 0.5;
	var polyPoint2Y = coordsDiag1[1] + 0.5;
	var polyPoint6X = coordsDiag1[2] + 0.5;
	var polyPoint6Y = coordsDiag1[3] + 0.5;

    var deltaXDiag2SQR = r*r/(1+diag2Slope*diag2Slope);
    var deltaXDiag2 = Math.pow(deltaXDiag2SQR, 0.5);
    var deltaYDiag2 = diag2Slope*deltaXDiag2;
    if(verb > 4){
		IJ.log(">>>> The fourth line is a diagonal from the botton left side of the oval to the top right. ");
		IJ.log(">>>> Points number 4 and 8 on the polygon will be obtained from the plotProfile function.");
	}
	var startXpixelNotCentered = xCentroid-deltaXDiag2;
	var startX = Math.floor(startXpixelNotCentered);
	var startYpixelNotCentered = yCentroid-deltaYDiag2;
	var startY = Math.floor(startYpixelNotCentered);
	var endXpixelNotCentered = xCentroid+deltaXDiag2;
	var endX = Math.floor(endXpixelNotCentered);
	var endYpixelNotCentered = yCentroid+deltaYDiag2;
	var endY = Math.floor(endYpixelNotCentered);

    // Correcting the diagonal so that it would go through the center.
    if(verb > 4){IJ.log("Correcting the center of mass of the diagonal.");}
	var finishXY = findPointonVect(startX,startY,endX,endY,xCenter,yCenter,roiWidth/2);
    var beginXY = findPointonVect(endX,endY,startX,startY,xCenter,yCenter,roiWidth/2);
    startX = beginXY[0];
    startY = beginXY[1];
    endX = finishXY[0];
    endY = finishXY[1];
    
	if(verb > 4){
		IJ.log(">>>> startX: " + startX + ", " + "startY: " + startY + ", " + " endX: " + endX + ", " + " endY: " + endY);
		IJ.log(">>> plotProfile will return the coordinates two points on the polygon that are on the 2nd diagonal, which goes from the bottom left to the top right.");
	}
	
	var coordsDiag2 = usePlotProfile(imp,startX, startY, endX, endY,leftThresh,currentCell);
	var coordsOK = areCoordsOK(coordsDiag2,currentCell,imp);
	if(verb > 4){
		IJ.log(">>>> Checking if the coords obtained from usePlotProfile are in the cell. If not, the function will return false because it did not make a polygon.");
	}
	if(coordsOK == false){
		if(verb > 4){IJ.log("No polygon was formed - makePolygon will return minus 1 for cell number: " + currentCell.Indx);}
		return -1;
	}
	var polyPoint8X = coordsDiag2[0] + 0.5;
	var polyPoint8Y = coordsDiag2[1] + 0.5;
	var polyPoint4X = coordsDiag2[2] + 0.5;
	var polyPoint4Y = coordsDiag2[3] + 0.5;
	if(verb > 4){IJ.log(">>> The x-values of the polygon points will be stored in a double array.");}


	var polyPoint1Y = yCenter;
	var polyPoint5Y = yCenter;
	
    var xDoubleArray = new Array();
    xDoubleArray.push(polyPoint1X);
    xDoubleArray.push(polyPoint2X);
    xDoubleArray.push(polyPoint3X);
    xDoubleArray.push(polyPoint4X);
    xDoubleArray.push(polyPoint5X);
    xDoubleArray.push(polyPoint6X);
    xDoubleArray.push(polyPoint7X);
    xDoubleArray.push(polyPoint8X);
	if(verb > 4){
		IJ.log(">>> The y-values of the polygon points will be stored in a double array - the order must correspond to the x-double array.");
		IJ.log(">>> The current polygon is usually skewed to the top and right because ImageJ rounds the numbers down in order to plot the line profile.");
	}
    var yDoubleArray = new Array();

	yDoubleArray.push(polyPoint1Y);
    yDoubleArray.push(polyPoint2Y);
    yDoubleArray.push(polyPoint3Y);
    yDoubleArray.push(polyPoint4Y);
	yDoubleArray.push(polyPoint5Y);
	yDoubleArray.push(polyPoint6Y);
	yDoubleArray.push(polyPoint7Y);
	yDoubleArray.push(polyPoint8Y);
	if(verb > 4){
		IJ.log(">>> The x-values of the polygon will be corrected according to the foci ROI centroid, since the plot profile line coord. accuracy is no less than a pixel.");
	}

    if(verb > 4){IJ.log(">>>> The x and y arrays have to be converted to float, in order to use them to form a polygon.");}
	var xFloatArray = Tools.toFloat(xDoubleArray);
	var yFloatArray = Tools.toFloat(yDoubleArray);
	if(verb > 4){IJ.log(">>>> Forming the polygon ROI.");}
	var polyRoi = new PolygonRoi(xFloatArray, yFloatArray, 2);
	if(verb > 4){IJ.log(">>>> Setting the polygon ROI on the ImagePlus.");}
	imp.setRoi(polyRoi);
	ip.setRoi(polyRoi);
	var polyFociStts = imp.getAllStatistics();
	var polyFociArea = polyFociStts.area;
	var polyFociPerim = polyRoi.getLength();
	var polyPerimSQRD = polyFociPerim*polyFociPerim;
	var polyFociCirc = 4*Math.PI*polyFociArea/polyPerimSQRD;
	
	
	IJ.run(imp, "To Bounding Box", "");
	var polyBoxRoi = imp.getRoi();
	imp.setRoi(polyBoxRoi);
	if(verb > 4){IJ.log(">>>> Adding the polygon ROI to the ROI manager.");}
	var polyBoxStts = imp.getAllStatistics();
	var polyBoxWdth = polyBoxStts.roiWidth;
	var polyBoxHt = polyBoxStts.roiHeight;
	
	// Check if the polygon's width and height are smaller than the cell's width and height:
	
	imp.setRoi(currentCell.ROIobj);
	var cellStts = imp.getAllStatistics();
	var cellWdth = cellStts.roiWidth;
	var cellHt = cellStts.roiHeight;
	

	if(polyBoxWdth < 0.75*cellWdth){
		var isPolyOK1 = true;
	}
	else{
		var isPolyOK1 = false;
	}

	if(polyBoxHt < 0.5*cellHt){
		var isPolyOK2 = true;
	}
	else{
		var isPolyOK2 = false;
	}

	if(polyFociArea > minPolygArea){
		var isPolyAreaOK = true;
	}
	else{
		var isPolyAreaOK = false;
	}

	if(polyFociCirc > minPolygCirc){
		var isPolyCircOK = true;
	}
	else{
		var isPolyCircOK = false;
	}
	
	if((isPolyOK1==false) | (isPolyOK2==false) | (isPolyAreaOK == false) | (isPolyCircOK == false)){
		return -1;
	}
	else{
		return polyRoi;
	}
}




function usePlotProfile(imp,startX,startY,endX,endY,leftThresh,currentCell){ // essential for the foci script
	// usePlotProfile takes: the ImagePlus object, startX, and startY, which are the x and y coordinates in which the line starts,
	// endX and endY, which are the x and y coordinates in which the line ends, the left threshold, ELIMINATECROSSTALK - which is 
	// true if the user wants to use the lines tangent to the inflection points of the Gaussian curve and false if the user wants
	// to use the Gaussian curve itself, and the last argument it takes is the current cell object.
	// It returns a pair of points on the foci polygon. This pair of points is on the line defined by startX, startY, endX, endY.
	var verb = 4;
	if(verb > 4){
		IJ.log("usePlotProfile arg leftThresh is equal to: " + leftThresh + " at the beginning of this function.");
	}
	var line = new Line(startX,startY,endX,endY);
	// Change after debugging:
	rm.addRoi(line);
	if(verb > 4){
		IJ.log("The initial line goes from startX: " + startX + " , startY: " + startY + " , endX: " + endX + " and endY: " + endY);
	}
	imp.setRoi(line);
	//throw new Error("Something went badly wrong!");
	// end of change after debugging:
    var lineLengthSQR = (endX - startX)*(endX - startX) + (endY - startY)*(endY - startY);
    var lineLength = Math.pow(lineLengthSQR,0.5);
    if(lineLength < 10){
    	var lineOK = false;
    	if(verb > 4){
    		IJ.log("The line is too short in order to eliminate the crosstalk. Will use the Gaussian fit itself.");
    	}
    }
    else{
    	var lineOK = true;
    	if(verb > 4){
    		IJ.log("The line is not too short in order to eliminate the crosstalk. Will eliminate the crosstalk.");
    	}
    }
    if(verb > 4){IJ.log("The total length of the line whose profile will be plotted is: " + lineLength);}
	if(verb > 4){IJ.log(">>>> Will set the line ROI on the ImagePlus.");}
	imp.setRoi(line);
	if(verb > 4){IJ.log(">>>> Will get the imp object again in order to update it.");}
	if(verb > 4){IJ.log(">>>> Will construct the ProfilePlot object.");}
	
	var prfl = new ProfilePlot(imp); 
	if(verb > 4){IJ.log(">>>> Will get the plot profile's y-values.");}
	var profileYvals = prfl.getProfile(); // This is double[]
	if(verb > 4){
		IJ.log(">>>> The plot profile's x-values are protected and there is no getter in the PlotProfile class for x-values.");
		IJ.log(">>>> Will construct a Plot object in order to get the x-values later.");
	}
	var plt = prfl.getPlot();
	if(verb > 4){IJ.log(">>>> Will get the profileXvalsFloat array. These are the x-values but in float. We will need double.");} 
	var profileXvalsFloat = plt.getXValues(); // This is float[]
	if(verb > 4){
		for(n=0;n<profileXvalsFloat.length;n++){
			IJ.log(">>>> The next float x value is: " + profileXvalsFloat[n] + "and the y-value is: " + profileYvals[n]);
		}
	}
	var profileXvals = Tools.toDouble(profileXvalsFloat);
	if(verb > 4){
	    for(var n=0;n<profileXvals.length;n++){
			IJ.log(">>>> The next double x value is: " + profileXvals[n]);
		}
	}
	if(verb > 4){IJ.log(">>>> Will construct a CurveFitter object using two double arrays - the x-values and the y-values.");}
	// At y max:
	var crvfit = new CurveFitter(profileXvals,profileYvals);
	if(verb > 4){IJ.log(">>> Will do a Gaussian curve fit - the integer 12 represents the Gaussian fit type.");}
	crvfit.doFit(12,false);
	if(verb > 4){IJ.log(">>>> calculate the goodness of fit.");}
	var goodnsFit = crvfit.getFitGoodness();
	if(verb > 4){IJ.log(">>>> The goodness of fit for the Gaussian curve is: " + goodnsFit);}
	var fitFormula = crvfit.getFormula();
	if(verb > 4){IJ.log(">>>> The formula is: " + fitFormula);}
	var fitName = crvfit.getName();
	if(verb > 4){IJ.log(">>>> The fit name is: " + fitName);}
	var numofParams = crvfit.getNumParams();
	if(verb > 4){IJ.log(">>>> The number of parameters is: " + numofParams);}
	if(verb > 4){IJ.log(">>>> Will get the array of parameters. There are: " + numofParams + " parameters.");}
	var paramsArr = crvfit.getParams();
	for(var i=0;i<numofParams;i++){
		if(i==0){
			var a = paramsArr[i];
			if(verb > 4){
				IJ.log(">>>> The value of a is: " + a);
			}
		}
		if(i==1){
			var b = paramsArr[i];
			if(verb > 4){
				IJ.log(">>>> The value of b is: " + b);
			}
		}
		if(i==2){
			var mu = paramsArr[i];
			var c = mu;
			if(verb > 4){
				IJ.log(">>>> The value of c is: " + c);
				IJ.log(">>>> The meaning of c is the mean - therefore, I will also call it mu sometimes.");
			}
		}
		else if(i==3){
			var sigma = paramsArr[i];
			var d = sigma;
			if(verb > 4){
				IJ.log(">>>> The value of d is: " + d);
				IJ.log(">>>> The meaning of d is the standard deviation - therefore, I will also call it sigma sometimes.");
			}
		}
	}
	var Rsqr = crvfit.getRSquared();
	if(verb > 4){
		IJ.log(">>> The R squared value is: " + Rsqr);
		IJ.log(">>> The Ymax value of the plot is: " + mu);
		IJ.log(">>> The sigma value is: " + sigma);
	}
	if(verb > 4){IJ.log(">>>> Will construct a Fitter object, which is needed in order to plot the Gaussian curve.");}
	//	To plot the Gaussian curve, use the following commands:
	//fittr = Fitter();
	//fittr.plot(crvfit);
	if(verb > 4){IJ.log("Will calculate the x-values of 2 inflection points.");}
	var inflectionPoint1X = mu - sigma;
	var inflectionPoint2X = mu + sigma;
	if(verb > 4){
		IJ.log("> The first inflection point x-value is mu - sigma: " + inflectionPoint1X);
		IJ.log("> The second inflection point x-value is mu + sigma: " + inflectionPoint2X);
	}
    
    // Finding x and y in the Gaussian plot:
	var xofYmax = c;
	if(verb > 4){IJ.log("xofYmax: " + c);}
	var x = xofYmax;
	var inthe_exp = -(x-c)*(x - c)/2*d*d;
	var yofYmax = a + (b  - c)*Math.exp(inthe_exp);
	if(verb > 4){
		IJ.log("yofYmax: " + yofYmax);
		IJ.log(">>> The y-value at y-max is: " + yofYmax + " in the plot coordinate system.");
	}

    var dist1 = xofYmax;
    var ymaxPicXY = findPointonVect(startX,startY,endX,endY,startX,startY,dist1);
    if(verb > 4){
	    IJ.log(">>> X at ymax is: " + ymaxPicXY[0] + " in the image coordinate system.");
	    IJ.log(">>> Y at ymax is: " + ymaxPicXY[1] + " in the image coordinate system.");
    }
	var infl1X = inflectionPoint1X; // Renaming to get a shorter name before substituting in the Gaussian equation.
	if(verb > 4){IJ.log("> Will substitute the x1-value of the 1st inflection point in the Gaussian curve equation to get the y1-value..");}
	var infl1Y = a + (b-a)*Math.exp(-(infl1X-c)*(infl1X-c)/(2*d*d));
	if(verb > 4){IJ.log("> Y for the first inflection point is: " + infl1Y);}
	var infl2X = inflectionPoint2X;
	if(verb > 4){IJ.log("> Will substitute the x2-value of the 2nd inflection point in the Gaussian curve equation to get the y2-value..");}
	var infl2Y = a + (b-a)*Math.exp(-(infl2X-c)*(infl2X-c)/(2*d*d));
	if(verb > 4){IJ.log("> Y for the 2nd inflection point is: " + infl2Y);}
	if(verb > 4){
		IJ.log("> Taking the derivative of the Gaussian curve formula in order to find the slopes of the lines at each of the inflection points.");
		IJ.log("> Will substitude the x and y values at each inflection point, to find the slope of each of the 2 lines.");
	}
	var slopeinfl1 = -(b-a)*(infl1X-c)/(d*d)*Math.exp(-(infl1X-c)*(infl1X-c)/(2*d*d));
	var slopeinfl2 = -(b-a)*(infl2X-c)/(d*d)*Math.exp(-(infl2X-c)*(infl2X-c)/(2*d*d));
	if(verb > 4){
		IJ.log("> slopeinfl1: " + slopeinfl1);
		IJ.log("> slopeinfl2: " + slopeinfl2);
	}
	if((slopeinfl1 == 0) | (slopeinfl2==0)){
		// A very rare case - this is to prevent the script from crashing. The polygon will not be formed in this case.
		var pointsonPoly = new Array();
		pointsonPoly.push(0.00);
		pointsonPoly.push(0.00);
		pointsonPoly.push(0.00);
		pointsonPoly.push(0.00);
		pointsonPoly.push(0.00);
		pointsonPoly.push(0.00);
		if(verb > 1){
			IJ.log("UsePlotProfile returns zeros because the the slope at the inflection points was zero, which is a rare case that should be omitted.");
		}
		return pointsonPoly;
	}
	if(verb > 4){IJ.log("> Will calculate the intercept of each line by substituting the x and y of each inflection point and the slope.");}
	var b1 = infl1Y - infl1X*slopeinfl1;
	var b2 = infl2Y - infl2X*slopeinfl2;
	if(verb > 4){IJ.log("> Now calculating the intercept with y equals: " + leftThresh);}
	if(verb > 4){
		IJ.log("> b1: " + b1);
		IJ.log("> b2: " + b2);
	}
	var xMinFluo1 = -b1/slopeinfl1 + leftThresh/slopeinfl1; 
	var xMinFluo2 = -b2/slopeinfl2 + leftThresh/slopeinfl2;
	if(verb > 4){
		IJ.log("> At what x value y equals factor*medianCellInt for inflection point 1: " + xMinFluo1 + " this point will be called xMinFluo1.");
		IJ.log("> At what x value y equals factor*medianCellInt for inflection point 2: " + xMinFluo2 + " this point will be called xMinFluo2.");
		IJ.log("> The distance between xMinFluo1 to xofYmax in the plot coordinates is called dist1.");
		IJ.log("> The distance between xMinFluo2 to xofYmax in the plot coordinates is called dist2.");
		
	}
	var dist1 = 0; var dist2 = 0;
	var inLog = (leftThresh-a)/(b-a);
	if(verb > 4){IJ.log("inLog is: " + inLog);}
	if(STATIC_ELIMINATECROSSTALK && lineOK){
    	var dist1 = Math.abs(xMinFluo1 - xofYmax);
    	var dist2 = Math.abs(xMinFluo2 - xofYmax);
    	if(verb > 4){
			IJ.log("Eliminating the crosstalk. The distance between the max fluorescence point and the beginning of the line is: " + dist1);
			IJ.log("Eliminating the crosstalk. The distance between the max fluorescence point and the end of the line is: " + dist2);
    	}
	}
	else if((inLog < 0) | (inLog > 1) | (inLog == 0)){ // An inLog which is larger than one will give an (x-c)^2 value which is negative in the eliminate crosstalk method. If b-a is 0 inLog will be infinity.
		IJ.log("Cannot use Gaussian function in this case. Using the ELIMINATECROSSTALK method instead.");
		var dist1 = Math.abs(xMinFluo1 - xofYmax);
    	var dist2 = Math.abs(xMinFluo2 - xofYmax);
    	if(verb > 1){
			IJ.log("xMinFluo1: " + xMinFluo1 + ", xofYmax: " + xofYmax + " , xMinFluo2:" + xMinFluo2);
			IJ.log("Eliminating the crosstalk. The distance between the max fluorescence point and the beginning of the line is: " + dist1);
			IJ.log("Eliminating the crosstalk. The distance between the max fluorescence point and the end of the line is: " + dist2);
    	}
	}
	else{
		if(verb > 1){IJ.log("Crossing the left threshold with the Gaussian function will give us two line segments.");}
		var xminuscSQR = -2*d*d*Math.log(inLog);
		var bMinusa = b-a;
		if(verb > 1){IJ.log("inLog is: " + inLog);}
		if(verb > 1){IJ.log("d is: " + d);}
		if(verb > 1){IJ.log("bMinusa is: " + bMinusa);}
		if(verb > 1){IJ.log("xminuscSQR is: " + xminuscSQR);}
		var x1minusc = Math.pow(xminuscSQR, 0.5);
		var x2minusc = -Math.pow(xminuscSQR, 0.5);
    	var dist1 = Math.abs(x1minusc + c - xofYmax);
    	var dist2 = Math.abs(x2minusc + c - xofYmax);
    	if(verb > 1){
			IJ.log("x1minusc is: " + x1minusc);
			IJ.log("x2minusc is: " + x2minusc);
			IJ.log("The length of the line connecting the point of max fluo. with the beginning of the examined line is: " + dist1);
			IJ.log("The length of the line connecting the point of max fluo. with the end of the examined line is: " + dist2);
    	}
	}
    
    if(verb > 1){
    	IJ.log("> Calc. coords 1 and 2 by giving the direction vector from xofYmax to xMinFluo, the size of the vector is dist1 and it should start from x at ymax in the image coordinates.");
    }
	var coords1 = findPointonVect(endX,endY,startX,startY,ymaxPicXY[0],ymaxPicXY[1],dist1);
	var coords2 = findPointonVect(startX,startY,endX,endY,ymaxPicXY[0],ymaxPicXY[1],dist2);
	if(verb > 1){
		IJ.log("> The two points that will be on the polygon calculated in usePlotprofile that will be returned: ");
		IJ.log("> x1coord: " + coords1[0]);
		IJ.log("> y1coord: " + coords1[1]);
		IJ.log("> x2coord: " + coords2[0]);
		IJ.log("> y2coord: " + coords2[1]);
		IJ.log("These values are for the following object: " + currentCell.Indx);
	}
	
	var pointsonPoly = new Array();
	pointsonPoly.push(coords1[0]);
	pointsonPoly.push(coords1[1]);
	pointsonPoly.push(coords2[0]);
	pointsonPoly.push(coords2[1]);
	pointsonPoly.push(ymaxPicXY[0]);
	pointsonPoly.push(ymaxPicXY[1]);
	if(verb > 1){
		IJ.log("usePlotProfile returns: " + "coords1x: " +  coords1[0] + ", coords1y: " + coords1[1] + ", coords2x: " + coords2[0] + ", coords2y: " + coords2[1] + ", ymaxPicXY0: " + ymaxPicXY[0] + ", ymaxPicXY1: " + ymaxPicXY[1]);
	}
	return pointsonPoly;
}

function avg2nums(num1,num2){
	var avgofNums = (num1 + num2)/2;
	return avgofNums;
}


function findPointonVect(vectX1,vectY1,vectX2,vectY2,pointX,pointY,distance){ // essential for the foci script
	// The vector that gives the direction starts from coordinates vectX1, vectY1 (the first pair of arguments) and ends at coords vectX2 and vectY2. (the 2nd pair of arguments) 
	// The third pair of arguments, pointX and point Y define the point from which we want to start.
	// The distance is how far we would like to go from the starting point defined by pointX, pointY in the direction of the direction vector.
	// It returns an array - the first element is the x-value of the point we want to get to and the second element is the y-value of the point we want to get to.
	var verb = 4;
	if(verb > 4){
	    IJ.log(">>>> Given a vector that gives the direction, a point and a distance, this function will return the coordinates.");
	    IJ.log(">>>> The order of the points give the vector's direction.");
	    IJ.log(">>>> The line formula used here is y = ax + b, but I will also take the direction into account.");
	}
	var deltaX = 0;
	var deltaY = 0;
	var deltaX = vectX2 - vectX1;
	if(verb > 4){IJ.log(">>>> deltaX is: " + deltaX);}
	if(deltaX > 0){
		var signofX = 1;
		if(verb > 4){IJ.log(">>>> x goes up.");}
	}
	else{
		var signofX = -1;
		if(verb > 4){IJ.log(">>>> x goes down.");}
	}
    var deltaY = vectY2 - vectY1;
    if(verb > 4){IJ.log(">>>> deltaY is: " + deltaY);}
	if(deltaY > 0){
		var signofY = 1;
		if(verb > 4){
			IJ.log(">>>> y goes up.");
		}
	}
	else{
		var signofY = -1;
		if(verb > 4){IJ.log(">>>> y goes down.");}
	}
	var slope = deltaY/deltaX;
	if(verb > 4){IJ.log(">>>> The slope of the line is: " + slope);}
	var theta = Math.atan(slope);
	if(verb > 4){IJ.log(">>>> Theta is the angle that the line forms with the x-axis, and it is: " + theta);}
	var xfromOrigin = distance*Math.cos(theta);
	var yfromOrigin = distance*Math.sin(theta);
	if(verb > 4){
		IJ.log(">>>> The distance of the point we are looking for would have been this distance if it would start from the origin - xfromOrigin: " + xfromOrigin);
		IJ.log(">>>> And the corresponding yvalue, yfromOrigin: " + yfromOrigin);
	}
	if(verb > 4){
		IJ.log(">>>> The absolute values will be calculated first, and then the signs will be added.");
		IJ.log(">>>> PointX and PointY are the coordinates sent to this function as the points that the vector should start from.");
	}
	var xfromOriginAbs = Math.abs(xfromOrigin);
	var yfromOriginAbs = Math.abs(yfromOrigin);
	var xcoord = xfromOriginAbs*signofX + pointX;
	var ycoord = yfromOriginAbs*signofY + pointY;
	if(verb > 4){
		IJ.log(">>>> This vector brought us to the xcoord: " + xcoord);
		IJ.log(">>>> This vector brought us to the ycoord: " + ycoord);
	}
	var coords = new Array();
	coords.push(xcoord);
	coords.push(ycoord);
	return coords;
}


function areCoordsinCell(coordsArr,currentCell){ // essential for the foci script
	// Takes the array of coords returned by usePlotProfile and the current cell object. Returns true if all of them are in the cell and false if at least one of them isn't. 
	var verb = 4;
	var firstPointX = Math.round(coordsArr[0]);
	var firstPointY = Math.round(coordsArr[1]);
	var secondPointX = Math.round(coordsArr[2]);
	var secondPointY = Math.round(coordsArr[3]);
	var thirdPointX = Math.round(coordsArr[4]);
	var thirdPointY = Math.round(coordsArr[5]);
    var cellRoi = currentCell.ROIobj;
    if(verb > 4){
    	IJ.log("firstPointX is: " + firstPointX);
   	 	IJ.log("firstPointY is: " + firstPointY);
    }
    var isinCell1 = cellRoi.contains(firstPointX, firstPointY);
    if(verb > 4){
    	IJ.log("isinCell1 is: " + isinCell1);
    }
    var isinCell2 = cellRoi.contains(secondPointX, secondPointY);
    var isinCell3 = cellRoi.contains(thirdPointX,thirdPointY);
    if( isinCell1 && isinCell2 && isinCell3){
    	return true;
    }
    else{
    	return false;
    }
	
}

function areCoordsOK(coordsArr,currentCell,imp){ // essential for the foci script
	// Takes the array of coords returned by usePlotProfile and the current cell object. Returns true if all of them are in the cell and false if at least one of them isn't. 
	var verb = 4;
	var firstPointX = Math.round(coordsArr[0]);
	var firstPointY = Math.round(coordsArr[1]);
	var secondPointX = Math.round(coordsArr[2]);
	var secondPointY = Math.round(coordsArr[3]);
	var lineCentrX = (firstPointX + secondPointX)/2;
	var lineCentrY = (firstPointY + secondPointY)/2;
    var cellRoi = currentCell.ROIobj;
    var isinCell = cellRoi.contains(lineCentrX, lineCentrY);
    
    var xDiff = Math.abs(secondPointX - firstPointX);
    var yDiff = Math.abs(secondPointY - firstPointY);
    var lineLenSQRD = xDiff*xDiff + yDiff*yDiff;
    var lineLen = Math.pow(lineLenSQRD, 0.5);
    
	imp.setRoi(cellRoi);
	var cellStats = imp.getAllStatistics();
	var cellWidth = cellStats.roiWidth;
	var cellHeight = cellStats.roiHeight;
	
	if(lineLen > cellWidth){
		var isntooLong1 = false;
	}
	else{
		var isntooLong1 = true;
	}
	var cellHeight = cellRoi.roiHeight;
	if(lineLen > cellHeight){
		var isntooLong2 = false;
	}
	else{
		var isntooLong2 = true;
	}
    //var isinCell2 = cellRoi.contains(secondPointX, secondPointY);
    //var isinCell3 = cellRoi.contains(thirdPointX,thirdPointY);
    if( isinCell && isntooLong1 && isntooLong2){
    //if(isinCell){
    	return true;
    }
    else{
    	return false;
    }
	
}



function addsubFoci(subROIfld,currentCell,fociArr,k){  // essential for the foci script
	// There are three possible fields that this function takes: subROIfld can be - "origsubFoci", "ovalsubFoci" or "polygsubFoci". 
	// These are fields in the cell object, representing sub-cellular elements. 
	// The second argument is the cell object, the third argument is the foci object array that will be added to the currentCell object, in the subROIfld, and in the k-channel.
	// The fourth argument is k, the channel in which the foci was segmented. (the in_ch) 
	// All of the foci in the fociArr will be added one by one to the selected sub-cellular field. 
	// It returns the updated cell object. 
	var verb = 4;
	if(verb > 4){IJ.log("In the addsubFoci function, and the foci array length is: " + fociArr.length);}
	if(fociArr.length > 0){
		if(verb > 4){IJ.log("Adding fields for: " + subROIfld);}
		for(var fociNum = 0; fociNum < fociArr.length; fociNum++){
			var currentFoci = new myROI(STATIC_FLCHANNELS.length);
			currentFoci.type = "foci";
			currentFoci.ROIobj = fociArr[fociNum];
			currentCell[subROIfld][k][fociNum] = currentFoci;
			if(verb > 4){IJ.log("The foci height in addsubFoci is: " + currentCell[subROIfld][k][fociNum].ROIobj.getFloatHeight() );}
		}
	}
	return currentCell;
}


function sortbyareafld(a, b){ // essential for the foci script
	// Given an array of myROI objects, it sorts them according to an ascending order with respect to their area fields.
	if(a.area < b.area){
		return 1;
	}
	else if(a.area > b.area){
		return -1;
	}
	else{
		return 0;
	}
}


function histFiveBins(selROI,impProc){ // essential for the foci script
    // This function takes the Roi and the ImagePlus object. It divides the pixels into five equally sized bins (with an equally sized range of grayvalues).
    // It returns the sum of the counts for each bin, and the binRatio, which is the ratio between the number of grayish pixels to the number of pixels
    // which are black or white. A high value means the cell is grayish and a low ratio means the cell has a lot of black, white or black and white pixels.
    // It returns an array which holds the five bin values and the bin ratio.
    var verb = 4;
    if(verb > 4){IJ.log(">>>>> Started running the histFiveBins function.");}
    var ipProc = impProc.getProcessor();
    impProc.setRoi(selROI); // Making sure the ImageProcessor has the selection.
    ipProc.setRoi(selROI); // Making sure the ImageProcessor has the selection.
    var statsBr = impProc.getAllStatistics(); // Br stands for Brightfield
    //var statsBr = ipProc.getStatistics(); // Br stands for Brightfield
    var mean = statsBr.mean;
    var counts = statsBr.histogram;
    var graylevels = new Array;
    var xMaxHist = statsBr.max;
    var xMinHist = statsBr.min;
    for (var i=0; i<counts.length; i++) {
        graylevels[i] = xMinHist+i*statsBr.binSize;
    }
    
    var b1sum = 0;
    var b2sum = 0;
    var b3sum = 0;
    var b4sum = 0;
    var b5sum = 0;
    
    for(var i=0;i<counts.length;i++){
	    if(i < Math.floor(counts.length/5)){
            var b1sum = b1sum + counts[i];
	    }
	    else if((i > Math.floor(counts.length/5)) && (i < 2*Math.floor(counts.length/5))){
            var b2sum = b2sum + counts[i];
	    }
	    else if((i > 2*Math.floor(counts.length/5)) && (i < 3*Math.floor(counts.length/5))){
            var b3sum = b3sum + counts[i];
	    }
	    else if((i > 3*Math.floor(counts.length/5)) && (i < 4*Math.floor(counts.length/5))){
            var b4sum = b4sum + counts[i];
	    }
	    else if(i > 4*Math.floor(counts.length/5)){
            var b5sum = b5sum + counts[i];
	    }
    }
    var binRatio = 0;
    if((b1sum + b5sum) < 1){ // I don't want this value to explode, so I'm setting it to a known high value
	    binRatio = 3000;
    }
    else{
        binRatio = (b2sum + b3sum)/(b1sum + b5sum);
    }
    var binsAndbinRatio = new Array();
    binsAndbinRatio[0] = b1sum;
    binsAndbinRatio[1] = b2sum;
    binsAndbinRatio[2] = b3sum;
    binsAndbinRatio[3] = b4sum;
    binsAndbinRatio[4] = b5sum;
    binsAndbinRatio[5] = binRatio;
    if(verb > 4){IJ.log(">>>>> Finished running the histFiveBins function.");}
    return binsAndbinRatio;
}






function openCHFociImps(basenameprocList,file_i,dir,sNumprocList,currentImg){ // essential for the foci script
    // This function accepts FLCHANNELS - the array of channels that are expected to have foci, basenameprocList, which is the list of basenames
    // file_i, which is the index of the current proctk segmentation-output image being processed now, dir - the input directory string path
    // and sNumprocList, which is the array of s# (or t#). It opens each channel image and returns the array of foci channel ImagePlus objects. 
    var channelImgTitle = new Array();
    var channelImp = new Array();
    var chStkImp = new Array();
    var numFociCH = STATIC_FLCHANNELS.length; // The number of foci channels not including the Brightfield. 
    for(var k = 0; k< numFociCH;k++){
		//k = j - 1;
        channelImgTitle[k] = basenameprocList[file_i] + "_" + STATIC_FLCHANNELS[k] + "_" + sNumprocList[file_i] + ".tif";
		if(verb > 4){
			IJ.log(">>>>> The channel image name is: " + channelImgTitle[k]);
			IJ.log(">>>>> Attempting to open image: " + dir + channelImgTitle[k]);
		}
		var f = new File(dir+channelImgTitle[k]);
		if(f.exists()){ // if the channel image exists as a tif, use the channel images.
			channelImp[k] = IJ.openImage(dir + channelImgTitle[k]);
			if(verb > 1){
				IJ.log("Successfully opened image: " + channelImgTitle[k]);
			}
			IJ.run(channelImp[k], "Set Scale...", "distance=0 known=0 pixel=1 unit=pixel");
			IJ.run(channelImp[k], "Gaussian Blur...", "sigma=0.50");
		}
		else{ // If the channel images are stacks, create the z-projection and this will be the channelImp.
			IJ.log("The tif image does not exist: " + channelImgTitle[k] + " - will look for a corresponding stk.");
			channelImgTitle[k] = basenameprocList[file_i] + "_" + STATIC_FLCHANNELS[k] + "_" + sNumprocList[file_i] + ".stk"; // Otherwise, get the average of the stack and use it as a channel image.
			chStkImp[k] = IJ.openImage(dir + channelImgTitle[k]);
			var fl = new File(dir+channelImgTitle[k]);
			if(fl.exists()){ // if the channel image exists as a tif, use the channel images.
				if(verb > 1){
					IJ.log("Successfully opened image stack: " + channelImgTitle[k]);
				}
			}
			var nSlices = chStkImp[k].getStackSize();
			if(verb > 4){
				IJ.log("The number of slices is: " + nSlices);
			}
			IJ.run(chStkImp[k], "Set Scale...", "distance=0 known=0 pixel=1 unit=pixel");
			IJ.run(chStkImp[k], "Gaussian Blur...", "sigma=0.50");
			channelImp[k] = zproject(chStkImp[k]);
		}
		IJ.run(channelImp[k], "Set Scale...", "distance=0 known=0 pixel=1 unit=pixel");
		IJ.run(channelImp[k], "Gaussian Blur...", "sigma=0.50");
		currentImg.impfl[k] = channelImp[k];
		var ip = channelImp[k].getProcessor();
		currentImg.chstr[k] = STATIC_CHANNELSTR[k];
		IJ.run(channelImp[k],"Remove Overlay", "");
		channelImp[k].setOverlay(currentImg.cellOvr);
    }
    return channelImp;
}




function getFociInfo(ROInum,k,currentCell,ip,imp,rm,currentImg,dirOutput,basenameprocList,sNumprocList,file_i,bgVal){ // essential for the foci script
	fociSegmAndMeasure(ROInum,k,currentCell,ip,imp,rm,bgVal);
   	var imp = currentImg.impfl[0]; // The ImagePlus channel number is chosen randomly, since these measurements are overlay channel independent. 
    var ip = imp.getProcessor();
   	for(var inch = 0; inch< currentImg.nflCh;inch++){ // measuring the area and x,y values for the foci.
    	measureFoci_OvrCH_indp(currentImg,ROInum,imp,ip,currentCell,inch);
   	}
   	
	for(var toch = 0; toch< currentImg.nflCh;toch++){
   		imp = currentImg.impfl[toch];
    	ip = imp.getProcessor();
		for(var inch = 0; inch< currentImg.nflCh;inch++){ // measuring the median intensity values for the foci.
			measureFoci_OvrCH_dp(currentImg,ROInum,imp,ip,currentCell,inch,toch);
		}
	}
}

function zproject(imp){
	// Creates a z-projection of a stack. Takes the startSlice of the stack, the stopSlice and the ImagePlus of the stack. Returns the projected ImagePlus.
	var zproj = new ZProjector(imp);
	zproj.setStartSlice(STATIC_STARTSLICE);
	zproj.setStopSlice(STATIC_STOPSLICE);
	zproj.setMethod(STATIC_METHOD);
	zproj.doProjection();
	var impProj = zproj.getProjection(); // It gives the same image format as the input image.
	return impProj;
}

function findBG(imp_BGmeasure){
	IJ.run(imp_BGmeasure, "Gaussian Blur...", "sigma=2.00");
	var bgovr = imp_BGmeasure.getOverlay();
	if (bgovr!=null){IJ.run(imp_BGmeasure,"Remove Overlay", "");} // Making sure that the statistics are for the whole image, rather than a selection.
	var bgStats = imp_BGmeasure.getAllStatistics();
	var bg = bgStats.min;
	return bg;
}
