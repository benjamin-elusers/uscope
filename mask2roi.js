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
PA = new ParticleAnalyzer()
PREF = new Prefs();
WM = new WildcardMatch();
OF = new Opener();
OD = new FolderOpener();
RT = new ResultsTable();
RT.setNaNEmptyCells(true); 
ImageConverter.setDoScaling(true);

if (RM==null){ IJ.error("ROI Manager is not found"); }
MACRO.batchMode = false; // activate batchmode (= setBatchMode(true) in IJ macro)
PREF.blackBackground = true;
file_sep	= "/"; // change to "\" if using windows I guess

//----USER INPUT----//
// PATH FOR INPUT IMAGE DIRECTORY
PATH2IMG = "/Users/benjamin/Desktop/Microscope/Mang-test2/OUT_masks/";
// PATH FOR CELL MASK DIRECTORY
PATH2MASK = "/Users/benjamin/Desktop/Microscope/Mang-test2/OUT_Binary/";
var SAVE_SEGIMG=true; // SAVE INPUT WITH OVERLAID ROIs FOR SEGMENTED CELLS
var SAVE_ROI=true; // SAVE SEGMENTED CELLS AS ZIP FILE OF ROIs

OUTPUT = new File("/Users/benjamin/Desktop/OUT_ROI/");
//------------------//
IJ.log("Raw images with overlaid ROIs will be saved in: "+OUTPUT.getCanonicalPath());
if( !OUTPUT.exists && OUTPUT.isDirectory() ){
	IJ.log("Directory was created successfully!");
	OUTPUT.mkdir();
}else{
	IJ.log("Output path does not exist or is not a directory.");
	OUTPUT = new File(IJ.getDirectory("home")+file_sep+"/Desktop/");
	IJ.log("Default output directory will be:"+OUTPUT.getCanonicalPath());
	
}

var PICS = new File(PATH2IMG);
if(!PICS.exists()){  IJ.error("'"+PICS+"' does not exist.");  throw 'path Not Found'; }
var PICLIST = Java.from(PICS.list()).sort();

var MASKS = new File(PATH2MASK);
if(!MASKS.exists()){ IJ.error("'"+MASKS+"' does not exist."); throw 'path Not Found'; }
var MASKLIST = Java.from(MASKS.list()).sort();

FROM=0;
TO=MASKLIST.length;

for(var ifile=FROM; ifile < TO; ifile++){
	// Reinitialize ROI manager in hidden mode and close all open windows
	RM.reset();
	IJ.run("Close All", "");
	
	// Open the mask output image file 
	IJ.log("File no. "+(ifile+1)+"/"+TO+" ("+MASKLIST[ifile]+")");
	var mask = IJ.openImage(PATH2MASK + file_sep + MASKLIST[ifile]);
	var ic  = new ImageConverter(mask);
	ic.convertToGray8();
	mask.updateAndDraw();

	var MAX = mask.getProcessor().getMax();

	// Threshold image for pixels with intensity > 0
	IJ.setAutoThreshold(mask, "Mean dark");
	IJ.setThreshold(mask, 1.0000, MAX, "Over/Under");
	IJ.run(mask, "Watershed", "");
	IJ.run(mask, "Fill Holes", "");

	// Delimit cell using the particle analyzer using binary image (exclude edges)
	IJ.run(mask, "Analyze Particles...", "exclude add");

//	IJ.run(mask, "Sharpen", "");
//	IJ.run(mask, "Make Binary", "");
	
	// Extract the cell masks and pass it to ROI Manager
	IJ.run(mask, "Create Selection", "");
	RM.addRoi(mask.getRoi());
	//RM.runCommand(mask,"Split");
	
	// Remove the composite ROI for the selection of all segmented cells (masks)
	//RM.select(0);
	//RM.runCommand(mask,"Delete");
	
	// Save cell masks as a compressed ZIP file of individual ROIs
	if(SAVE_ROI){
		ROIOUTPUT = OUTPUT.getCanonicalPath() + file_sep + mask.getShortTitle()+"-ROIset.zip";
		IJ.log("Saving ROIs in: "+ROIOUTPUT);
		RM.runCommand("Save",ROIOUTPUT);
	}

	// Save cell masks as ROIs overlaid to input image
	if(SAVE_SEGIMG){
		var maskname = mask.getShortTitle();
		var found = WM.match(PICLIST[ifile],"*"+maskname+"*");
		if( found ){
			IMGPATH = new File(PATH2IMG + file_sep + PICLIST[ ifile ]);
			input = IJ.openImage(IMGPATH);
			RM.moveRoisToOverlay(input);
			SEGIMG = OUTPUT.getCanonicalPath()+file_sep+input.getShortTitle()+"-withROI";
			IJ.log("Saving original image with overlaid ROIs from mask to : "+SEGIMG+".tif");
			IJ.saveAs(input,"Tiff", SEGIMG);
		}else{
			IJ.log("Mask '"+maskname+"' does not correspond to the raw image.");
		}
	}
}
RM.reset();
IJ.run("Close All", "");
IJ.log("DONE");

