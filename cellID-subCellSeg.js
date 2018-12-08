load("/media/elusers/users/avital/Scripts/functions_EDLASJuly10thJava8.js");
// Variables that the user needs to change all the time:

// To work from the command line with xvfb-run:


var name = arguments[0];
var ARGS = name.split("-"); 
var strSKIP = ARGS[0];
var strUNTIL = ARGS[1];
var STATIC_SKIP = parseInt(strSKIP);
var STATIC_UNTIL = parseInt(strUNTIL);


// To work directly from Fiji, without the command line (comment it out if you're using the command line):
//var STATIC_SKIP = 0;
//var STATIC_UNTIL= 1;

STATIC_DIR = "/media/elmicro/meta/PromoterSWAT/screens/R1.1/plate_1/Images/";
//STATIC_DIR = "/media/elusers/users/avital/test_Apr18thImgs/";
//STATIC_DIR = "/media/elusers/users/avital/CrashedImg/";
//STATIC_DIR = "/media/elmicro/Yotam/17-03-20_gi_epi_O_P_BFP/17-03-21_epiPO_2/";
//STATIC_DIR = "/media/elusers/data/microscope/joe-microscope/Thesis/Qseries_29Feb16/SEGMENTED_Q4_p53_allAff_29Feb16/";
//STATIC_DIR = "/media/elusers/users/avital/Facultyday2017_input/";



//dir = "/Users/avitalsteinberg/Joe_BFPhomogen/";
//dir = "/Volumes/elusers/users/avital/JoesAvgZstk/";
//dir = "/media/elusers/users/avital/Images for Avital/JoesAvgZstk2/";
//var STATIC_ALLCHANNELS=["w1cf-Brightfield","w2cf-2cam-GFP","w3cf-2cam-RFP","w4cf-2cam-BFP"]; // The user has to enter all of the channels
var STATIC_ALLCHANNELS=["w1cf-Brightfield","w2cf-2cam-GFP","w3cf-2cam-RFP", "w4cf-2cam-BFP" ]; // The user has to enter all of the channels
var STATIC_FLCHOICE = ["no","yes","yes", "yes"]; // The channels selected using "yes" here will specify which fluo. channels will be measured and used for the foci segmentation. If segmentFoci is false, foci segmentation will be turned off.  
// The default factorTimesMedian is:
var STATIC_FACTORTIMESMEDIAN = new Array();
NYES = 0;
for(N = 0; N<STATIC_FLCHOICE.length;N++){
	if(STATIC_FLCHOICE[N]=="yes"){
		STATIC_FACTORTIMESMEDIAN[NYES] = 4;
		NYES++;
	}
}
// Changing the STATIC_FACTORTIMESMEDIAN array - if there are 2 foci channels, STATIC_FACTORTIMESMEDIAN can be [1,2] - the factor is 1 for the first foci channel and 2 for the 2nd one. If there are three, it can be [1,2,2], etc. 
//STATIC_FACTORTIMESMEDIAN = [3,3];
// Variables that the user may need to change sometimes:
var STATIC_VOLCHOICE = ["no","no"]; // Doesn't do anything yet - it says which channels from ALLCHANNELS should be used to measure the volumes. 
var STATIC_FLCHANNELS = new Array; // channels that will be used for foci measurements - will not Brightfield image.
var STATIC_MYVOLCH = new Array; // channels that will be used for volume measurements - will not contain the Brightfield image. 
var STATIC_FOCIANDVOL = new Array;
for(I=0;I<STATIC_ALLCHANNELS.length;I++){
	if((STATIC_FLCHOICE[I] == "yes") && (STATIC_ALLCHANNELS[I] != "w1cf-Brightfield") ){
		STATIC_FLCHANNELS.push(STATIC_ALLCHANNELS[I]);
	}
	if((STATIC_VOLCHOICE[I] == "yes") && (STATIC_ALLCHANNELS[I] != "w1cf-Brightfield") ){
		STATIC_MYVOLCH.push(STATIC_ALLCHANNELS[I]);
	}
}


var VERB = 4; 
var STATIC_METHOD = 0; // Set the stack projection method:
// Average is 0, max is 1, median is 5, min is 2, standard deviation is 4, and the sum is 3
var STATIC_MINFOCISIZE =9; // Limits the size of the foci thresholded by Analyze, Particles
var STATIC_MINPOLYGAREA = 9; // Limits the size of the final polygon foci
var STATIC_MINPOLYGCIRC = 0.5; // Limits the circularity of the final polygon foci
var STATIC_ELIMINATECROSSTALK = true;
var STATIC_NBRCH = 2; // Change to 1 if one of the brightfield images is missing.
var STATIC_OVERWRITE = false; // OVERWRITE = false means do not overwrite if result files exist. Otherwise, it will overwrite them.
var STATIC_SAVEFOCIIMGS = true; // If saveImgs is true, the segmented foci will be saved as an overlay on the channel they were segmented from. False is if you don't want to save the images.
var STATIC_SEGMENTFOCI = true;
var STATIC_STARTSLICE = 1;
var STATIC_STOPSLICE = 8;


if(VERB > 4){IJ.log("> Will process from: " + STATIC_SKIP + ", until: " + STATIC_UNTIL);}
var STATIC_CHANNELSTR = new Array();
for(var CHNUM = 0; CHNUM < STATIC_FLCHANNELS.length;CHNUM++){ // &&& AS - this is flCh 
    var CHPARTS = STATIC_FLCHANNELS[CHNUM].split("-");
	STATIC_CHANNELSTR[CHNUM] =  CHPARTS[CHPARTS.length-1]; // The last part of the channel name after the "-" is going to be used as the channel string.
	if(VERB > 4){print(">>>> The channel string for the excel file headers will be: " + STATIC_CHANNELSTR[CHNUM]);}
}

if(VERB > 4){ IJ.log(">>>> The input directory is: " + STATIC_DIR);}
DIROUTPUT = STATIC_DIR.substring(0, STATIC_DIR.length - 1)+ "_output/";
var FL = new File(DIROUTPUT);
if(!FL.exists()){
	FL.mkdir();
	if(VERB > 4){print(">>> Output directory did not exist - creating it.");}
}
if(VERB > 4){IJ.log("> The output directory is: " + DIROUTPUT);}
var rm = new RoiManager();// initiating the ROI manager 
if (rm==null)
     IJ.error("ROI Manager is not found"); 
var rt = new ResultsTable(); // Here, the default is hidden mode.
//cellOverlay = Overlay(); erase this
//dc = DirectoryChooser("Please choose an input directory.");
//dir = dc.getDirectory();
//dc2 = DirectoryChooser("Please choose an output directory.");
//dirOutput = dc2.getDirectory();


var FOLDEROBJ = new File(STATIC_DIR);
if(!FOLDEROBJ.exists()){
	IJ.log("> There is a problem, "+STATIC_DIR+" does not exist.");
}

var FILELIST = FOLDEROBJ.listFiles();

FILENAMEPARTS = filename_parts(FILELIST);
//throw new Error("Something went badly wrong!");
PROCNAMELIST = FILENAMEPARTS[0];
BASENAMEPROCLIST = FILENAMEPARTS[1];
SNUMPROCLIST = FILENAMEPARTS[2];

var NUMFROMSNUM = new Array();
for(J=0; J<PROCNAMELIST.length;J++){
	STRVAL = SNUMPROCLIST[J];
	NUMFROMSNUM[J] = parseInt(STRVAL.match(/[0-9]+/));
	if(VERB > 4){IJ.log(">>>> When SNUMPROCLIST is: " + SNUMPROCLIST[J] + " , then the extracted numfromSNUM is: " + NUMFROMSNUM[J]);}
}
var INDEXNUMSORTED = sortArrayandIndex(NUMFROMSNUM);

var NEWPROCNAMELIST = new Array();
var NEWBASENAMEPROCLIST = new Array();
var NEWSNUMPROCLIST = new Array();
if(VERB > 4){IJ.log("> Sorting the filenames.");}

for(K=0;K<NUMFROMSNUM.length;K++){ // sort the list according to the numbers in sNum.
	INDEX = INDEXNUMSORTED[K];
	NEWPROCNAMELIST[K] = PROCNAMELIST[INDEX];
	NEWBASENAMEPROCLIST[K] = BASENAMEPROCLIST[INDEX];
	NEWSNUMPROCLIST[K] = SNUMPROCLIST[INDEX];
}
for(L=0;L<NUMFROMSNUM.length;L++){
	PROCNAMELIST[L] = NEWPROCNAMELIST[L];
	BASENAMEPROCLIST[L] = NEWBASENAMEPROCLIST[L];
	SNUMPROCLIST[L] = NEWSNUMPROCLIST[L];
	if(VERB > 4){
	    IJ.log(">>>> Sorted files: ");
	    IJ.log(">>>> procNameList: " + PROCNAMELIST[L]);
	    IJ.log(">>>> BASENAMEPROCLIST: " + BASENAMEPROCLIST[L]);
	    IJ.log(">>>> sNumprocList: " + SNUMPROCLIST[L]);
	}
}
// If the user made a mistake and asked to process too many files (that don't exist in the folder), limit the range to the number of processed stk input files:
if(STATIC_UNTIL > PROCNAMELIST.length){
	STATIC_UNTIL = PROCNAMELIST.length;
	print("Setting UNTIL equal to: " + STATIC_UNTIL);
}


// The goal of this part is to sort the filenames according to the numbers that come after s or t.
for(var FILE_I=STATIC_SKIP; FILE_I<STATIC_UNTIL;FILE_I++){
    RESULTSNAME = DIROUTPUT + BASENAMEPROCLIST[FILE_I] + SNUMPROCLIST[FILE_I] + "Results.txt";
    IJ.log(">> Will check if the results file exists: " + RESULTSNAME);
    var FL2 = new File(RESULTSNAME);
    if((FL2.isFile() == false) | (STATIC_OVERWRITE)){
	    IJ.log(">> Results file does not exist: " + RESULTSNAME + " , therefore the corresponding image will be processed.");
	    BRIGHTFIELDIMP = openBFImps(PROCNAMELIST,FILE_I);
	    IMPPROC = BRIGHTFIELDIMP[0];
	    IMPOUTOFFOC = BRIGHTFIELDIMP[1];
	    //IJ.run("To ROI Manager", "");

        // Setting up the image object:
		var CURRENTIMG = new myImg();
		CURRENTIMG.impbf[0] = IMPPROC;
		CURRENTIMG.impbf[1] = IMPOUTOFFOC;
		CURRENTIMG.cellOvr = IMPPROC.getOverlay();
		if (CURRENTIMG.cellOvr == null) { 
			IJ.log(">> Skipped image: " + STATIC_DIR+ PROCNAMELIST[FILE_I] + " - image has no cells.")
			continue; 
	    }
		var NOBJECTS = CURRENTIMG.cellOvr.size(); // Check if this is problematic when there are no cells.
		if(VERB > 1){IJ.log("There are: " + NOBJECTS + " cells in the returned overlay.");}
        // Adding the fluorescent imps to the image object:
        openCHFociImps(BASENAMEPROCLIST,FILE_I,STATIC_DIR,SNUMPROCLIST,CURRENTIMG);
        var CELLARR = new Array();
        for( ROINUM=0; ROINUM < NOBJECTS; ROINUM++){
			CURRENTCELL = new myROI(STATIC_FLCHANNELS.length,STATIC_NBRCH);
			CURRENTCELL.type = "cell";
			SELECTEDROI = CURRENTIMG.cellOvr.get(ROINUM); 
			CURRENTCELL.ROIobj = SELECTEDROI;	
            CURRENTCELL.Indx = ROINUM;
            CELLARR.push(CURRENTCELL);
		}
		if(VERB > 4){IJ.log("Moving the cells to the ROI manager because the particle analyzer uses the ROI manager.");}
	    for(var k = 0; k< CURRENTIMG.impfl.length;k++){ // we don't want to iterate over the brightfield, so j starts from 1. &&& AS - this is flCh
			IMP = CURRENTIMG.impfl[k];
			//IMP.show();
		    IP = IMP.getProcessor();
			for( ROIN=0; ROIN<NOBJECTS; ROIN++){
	            var PIXARR = sortPixelArr(CELLARR[ROIN].ROIobj,IP,IMP);
	            getAllPercentiles(CELLARR[ROIN],PIXARR);
	            CELLARR[ROIN].medianfl[k] = CELLARR[ROIN].bin5fl[k];
	            // Getting the mean fluorescence of the cell:
	            IMP.setRoi(CELLARR[ROIN].ROIobj);
	            CELLROISTTS = IMP.getAllStatistics();
	            CELLARR[ROIN].meanfl[k] = CELLROISTTS.mean;
			} // closing the cell loop
		   if(STATIC_SEGMENTFOCI == true){
		   		IMP_BGMEASURE = IMP.duplicate(); // This may not be needed if the background value is set rather than measured
				//var BGVAL = findBG(IMP_BGMEASURE);
				var BGVAL = 100;
				IJ.log("The background for channel: " + k + " is: " + BGVAL);
		   		for( ROINM=0; ROINM<NOBJECTS; ROINM++){
		   			getFociInfo(ROINM,k,CELLARR[ROINM],IP,IMP,rm,CURRENTIMG,DIROUTPUT,BASENAMEPROCLIST,SNUMPROCLIST,FILE_I,BGVAL);
		   		}
		   }
		   if(STATIC_SAVEFOCIIMGS && STATIC_SEGMENTFOCI){ // This should only be done if the user wants to save foci related things
				strName = DIROUTPUT + BASENAMEPROCLIST[FILE_I] + SNUMPROCLIST[FILE_I] + "in_ch" + CURRENTIMG.chstr[k] + "to_ch" + CURRENTIMG.chstr[k];
				if(VERB > 4){IJ.log("For channel: " + CURRENTIMG.chstr[k] + "saveImg is true for" + strName);}
				CURRENTIMG.saveflCells(k,k,CELLARR,strName);
		   }
		   // END FOCIS
            // ROI X-Y + AREA
            for( ROINO=0; ROINO<NOBJECTS; ROINO++){ // measuring things that do not depend on the channel.
            	CELLARR[ROINO].area = measureROI(CELLARR[ROINO].ROIobj,IP,IMP,"area");
            	CELLARR[ROINO].x = measureROI(CELLARR[ROINO].ROIobj,IP,IMP,"xCenterOfMass");
            	CELLARR[ROINO].y = measureROI(CELLARR[ROINO].ROIobj,IP,IMP,"yCenterOfMass");
            	if(VERB > 4){IJ.log("For cell: " + ROINO + " area: " + CELLARR[ROINO].area + " , x-centroid: " + CELLARR[ROINO].x + " and y-centroid: " + CELLARR[ROINO].y);}
            }

            
	    } // closing the channel loop 


	    
	    if(VERB > 4){IJ.log("For the current image, the no. of brightfield channels is: " + CURRENTIMG.nbfCh);}
	    if(STATIC_SEGMENTFOCI == false){
			IJ.log("Did not search for foci in: " + BASENAMEPROCLIST[FILE_I] + SNUMPROCLIST[FILE_I]);
		}

	    
	    for(var i = 0; i< CURRENTIMG.nbfCh;i++){ // measuring the median intensity values for the cells per brightfield image.

	    	// BF STUFF JuneEDL
        	for( NUMROI=0; NUMROI<NOBJECTS; NUMROI++){
	            measureBF(NUMROI,i,CURRENTIMG,IMP,IP,CELLARR[NUMROI]);
	        }
        }
 
		// PRINTING JuneEDL
        for( NMROI=0; NMROI<NOBJECTS; NMROI++){
        	cell2line(CELLARR[NMROI], NMROI, CURRENTIMG, rt);
        }

    	RESULTSNAME = DIROUTPUT + BASENAMEPROCLIST[FILE_I] + SNUMPROCLIST[FILE_I] + "Results.txt";
		rt.saveAs(RESULTSNAME);
		var LOOPCOUNT = 0;
		while(CELLARR.length > 0 & LOOPCOUNT < 10000){
			CELLARR.pop(); // remove the last element from the cell array. The goal is to prevent a memory problem called Java heap space.
			LOOPCOUNT++;
    	}
	      
    } // closing the if
    
    else{
		IJ.log(">> Skipped image: " + STATIC_DIR+ PROCNAMELIST[FILE_I] + " - image has been processed already.");
    }
	IJ.run("Close All", "");
    rt.reset();
    rm.reset();
    IJ.log("> Done running for image: " + STATIC_DIR+ PROCNAMELIST[FILE_I]);
}
rm.reset();
rm.close();
IJ.log("Finished processing all of the images.");
RESULTSNAME = DIROUTPUT + STATIC_SKIP + "_" + STATIC_UNTIL + "Log.txt";
IJ.run("Close All", "");
