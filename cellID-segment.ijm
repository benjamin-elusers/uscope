

//
//    THIS MUST BE SET: 
//    - first channel is the string identifying the brightfield channel
//    - second channel is the string identifying the channel based on which the ROIs are going to be optimized for alignement
// 
//CHANNELS = newArray("w1cf-Brightfield","w2cf-2cam-GFP");
CHANNELS = newArray("w1cf-Brightfield","w2cf-2cam-GFP");
//CHANNELS = newArray("w1cf-Brightfield","w2cf-2cam-GFP");

//    THIS MUST BE SET:
//    - Directory to be processed  /!\ DO NOT FORGET SLASH AT THE END
//

dir = "/Users/benjamin/Desktop/Mang-test/Images/";
OVERWRITE   =  0;                // Whether an already processed file should be re-processed
WAND_STEP   =  50 ;              // applies the magic wand to remove background every 25 pixels
IMAGE_X	 	=  1293;             // Width of images
IMAGE_Y	 	=  1043;             // Height of images

G_PIXELS_PER_CELL = 50;          // typical size in pixels for a cell

inPrintRange = true; // Print only the lines I want to print, for which this variable is equal to true.

run("ROI Manager...");
//setBatchMode(true);
verb = 8;


//name = getArgument;
//ARGS = split( name, "-");

//SKIP will allow to SKIP the N first images.
//SKIP = parseInt(ARGS[0]);

// UNTIL will allow to stop after a certain number of processed images
//UNTIL= parseInt(ARGS[1]);


SKIP =0;
UNTIL =2;
// For a brightfield stack with only two slices like we used to have:
//outofFocSlcNum = 2; // The slice with the white borders which is going to be used for the segmentation.
//inFocSlcNum = 1;

// The default values for the in-focus and out of focus images: 
//outofFocSlcNum = nSlices; // The slice with the white borders which is going to be used for the segmentation - usually it's the last slice.
//inFocSlcNum = round(nSlices/2); // usually the middle slice

if(verb > 1){
    print("will process from "+SKIP+" to "+UNTIL+" images");
}
//print("Got here - exiting.");
//exit();
//dir = getDirectory("Please choose an input directory."); // This is the input directory
if(verb > 1){
    print("dir is: " + dir);
}

//dirOutput = getDirectory("Please choose an output directory."); // This is the output directory
dirOutput = dir;
if(! File.exists(dirOutput)){
	File.makeDirectory(dirOutput);
}

if(verb > 1){
    print("dir output is: " + dir);
}
               
// This program will handle dots and spaces in the title.

///
/// XMAIN LOOP
/// 

if(verb > 1){
    print("Getting the files ...");
}

list = getFileList(dir);
listSTK = newArray();

for(i=0; i<list.length; i++){
	matchVal = matches(list[i],'^.*_w1cf-Brightfield.*\.stk');
	if(verb > 4){
		print("matchVal is: " + matchVal);
	}
	if(matchVal == 1){
		listSTK = Array.concat(listSTK, list[i]);
		if(verb > 1){
			print("Adding: " + list[i] + " to listSTK.");
		}
	}
}

listSTK = Array.sort(listSTK); // This sorting method is less than perfect because "33" will come before "7" - it will be fixed by using a custom file sorting function.

print("----------------  There are ",list.length, "files in the directory and ",listSTK.length," brightfield STK files to process");
snum4sortList =  newArray(); // Extracting the snum from the .stk files in order to sort the list of files correctly.
for(i=0;i<listSTK.length;i++){
    snum4sort = getSnum(listSTK[i]);
    snum4sortList = Array.concat(snum4sortList, snum4sort);
    if(verb > 4){
        print("snum4sort is: " + snum4sortList[i]);
    }
}

numfromSNUM = newArray(); // Extracting the numbers from sNum, converted from string to a numerical format.
for(i=0; i<snum4sortList.length;i++){
	strVal = snum4sortList[i];
	num4sort = substring(strVal, 1);
	num4sortParsed = parseInt(num4sort);
	numfromSNUM = Array.concat(numfromSNUM, num4sortParsed);
	if(verb > 4){
	   print("numfromSNUM is: " + numfromSNUM[i]);
	}
}

indexnumSorted = sortArrayandIndex(numfromSNUM); // This function returns the ranks, i.e., the indexes, rather than the sorted values.

newlistSTK = newArray(numfromSNUM.length);

boolStk = false; // initializing to a default value.

for(i=0;i<numfromSNUM.length;i++){ // sort the list according to the numbers in sNum.
	index = indexnumSorted[i];
	newlistSTK[i] = listSTK[index];
	if(verb > 4){
	    print("The new listSTK: " + newlistSTK[i]);
	}
}

for(i=0;i<numfromSNUM.length;i++){
    listSTK[i] = newlistSTK[i]; // I want to use the old name, listSTK, because I find it convenient.
    if(verb > 4){
       print("We renamed newlistSTK back to listSTK so listSTK is:)" + listSTK[i]);
    }
}
print("SKIP is: " + SKIP + " and UNTIL is: " + UNTIL);
//nlistSTKMin1 = listSTK.length - 1;
for (i=SKIP; i < UNTIL; i++) {

	getDateAndTime(year, month, week, day, hour, min, sec, msec);
	if(verb > 1){
	    print(">>>> Now processing image number "+i+", at "+hour+":"+min+","+sec+"s -- file: "+listSTK[i]);
	}

	initialize_process();
    print("Before the replace command, listSTKi was: " + listSTK[i]);

	
	// Here I may process the image only if it was not procesed 
	OOF_IMAGE  = dir+replace(listSTK[i], '.stk', '-0002outoffocus.tif') ;
    OOF_IMAGE2 = dir+replace(listSTK[i], '.stk', '-0001procstk.tif') ;
    if(verb > 1){
	    print("The out of focus images will be: "+OOF_IMAGE);
	    print("The procstk images will be: "+OOF_IMAGE2);
    }
	
	if( File.exists(OOF_IMAGE2) && OVERWRITE==0){	
		if(verb > 4){
		    IJ.log(listSTK[i]+" has already been processed");
		}
		
	} else {
        if(CHANNELS.length > 1){
	        CH1name = listSTK[i];
	        if(verb > 4){
	        	print("The old name was: " + listSTK[i]);
	        }
	        CH1name = replace(CH1name,CHANNELS[0],CHANNELS[1]);
	        if(verb > 4){
	        	print("The first replace returned: " + CH1name + " - it replaced the first element of the CHANNELS array: " + CHANNELS[0] + " with the second element of this array: " + CHANNELS[1]);
	        }
	        if (!File.exists(dir+CH1name)){
      			CH1name = replace(CH1name,"stk","tif"); // If the channel images are not stacks, look for .tif channel images.
      			if(verb > 4){
      				print("The second replace returned: " + CH1name + " - it replaced stk with tif, since the channel images are not stacks. ");
      			}
      			boolStk = false; // relates to the channel images
	        }
	        else{
	        	boolStk = true;
	        }
        }
        
	    print("Attempting to open image: " + dir+listSTK[i]);
	    open(dir+listSTK[i]);
	    numofSlcs = nSlices;
	    numofSlcsPlus1 = numofSlcs + 1;
	    if(numofSlcs > 1){ // This can only be done after opening the brightfield stack
			if(verb > 1){
				print("There are: " + numofSlcs + " slices in the brightfield stack.");
			}
	    }
	    else{
	    	print("Error - only one slice for the brightfield channel image. Expecting the brightfield channel to have at least two channels.")
	    }
		imageName = getTitle(); // This is the name of the stack image name
		newName = checkSpacesinTitle(imageName);
		rename(newName);
		imageName = getTitle();
		inPrintRange = true;
		if(verb > 4){
		    print("imageName is: " + imageName + " and the newName without spaces is: " + newName);
		}
		imageTitleDotStk = imageName;
		run("Stack to Images");
		if(verb > 1){
		    print("imageTitleDotStk:",imageTitleDotStk);
		}
		nostkBrtfldTitle = replace(imageTitleDotStk, '.stk', '') ;
		if(verb > 1){
		    print("nostkBrtfldTitle is: " + nostkBrtfldTitle);
		}
		
		for (k=1; k<numofSlcsPlus1; k++) {
			imageTitle = nostkBrtfldTitle + "-000" + k; // use selectWindow(sliceName)
			imageTitleDotTif = imageTitle + ".tif"; // This is the name of the image
			print("Calling selectWindow for a k value of: " + k);
			selectWindow(imageTitle);
			run("Enhance Contrast", "saturated=0.35");
			outofFocSlcNum = numofSlcs; // The slice with the white borders which is going to be used for the segmentation - usually it's the last slice.
			inFocSlcNum = round(numofSlcs/2); // usually the middle slice
			if (k == outofFocSlcNum) {
				run("Set Scale...", "distance=0 known=0 pixel=1 unit=pixel");
				run("Gaussian Blur...", "sigma=2");
				customBrightnessContrast(IMAGE_X,IMAGE_Y);
				run("8-bit");
				if(CHANNELS.length > 1){
				    if(File.exists(dir+CH1name)){
				    	print("Attempting to open channel image: " + dir+CH1name);
				    	open(dir+CH1name);
				    }
				    else{
				    	print("Did not find image: " + dir+CH1name + " please check if what you wrote in the CHANNELS array matches your input folder.");
				    }
				    print("Attempting to open channel image: " + dir+CH1name); // I want an error to be thrown if the channel image doesn't exist, to make the user check his setup. (otherwise, I wouldn't try to open the image when it doesn't exist) 
				    open(dir+CH1name);
				    if(boolStk == true){
				    	midSlc = round(nSlices/2);
				    	setSlice(midSlc); // Setting the first channel slice to the middle slice if it's a stack, assuming that all stacks (brightfield and channels) are of the same length.
				    }
                    rename("CH1");
				}
				// Do something
				segment_cells(imageTitle,nostkBrtfldTitle,dirOutput,dir,IMAGE_X,IMAGE_Y,imageName,boolStk);
			} else if(k == inFocSlcNum) {
				print("Got to the else if for a k value of: " + k);
				run("8-bit");
				dirAndimageTitle =  dirOutput + imageTitle;
				dirAndimageTitletif = dirAndimageTitle + ".tif";
				print("Closing the image that has a k value of: " + k);
				close();
				
			}
			else{
				print("Got to the else for a k value of: " + k);
				print("Closing the image that has a k value of: " + k);
				close();
			}
		}
	}
	run("Close All");
}
print("Finished processing all of the images.");

function segment_cells(imageTitle,nostkBrtfldTitle,dirOutput,dir,IMAGE_X,IMAGE_Y,imageName,boolStk){
	goodCells = 0;
	wandBest = 0;
	gradient = 10;                // #Might vary from image to image. (8,12, 16 bits might matter)
	manualTolerance = 37;
	xWand=20;								  // number indicating the average diameter of a cell in pixels
	VWarea = 0;
	continueRunning = 1;
	gotAllBackground = 0;

	ImageTitleDotTif = imageTitle + ".tif"; 
	selectWindow(imageTitle);	
	run("Set Scale...", "distance=0 known=0 pixel=1 unit=pixel global");
	count = 0;
	run("Duplicate...", 'title=BF_'+gradient+"_"+1); // DECEMBER I think this image will be used for creating the binary image
	run("Gaussian Blur...", "sigma=2");
	
	run("Duplicate...", 'title=BF_'+gradient+"_"+2); //  DECEMBER what is image one for? 
	
	run("Duplicate...", 'title=varianceFiltered');   // This variance image will be used to avoid picking cells as background to be deleted.
	run("Variance...", "radius=8"); 

	
	imageTitle2 = 'BF_'+gradient+"_"+1;
	imageTitle3 = 'BF_'+gradient+"_"+2; // DECEMBER it's confusing to have imageTitle3 and the name is _2 ...
	imageTitle4 = 'varianceFiltered';
	optimizedWand = 0;
	VWtolerance = 0;
	nObjects = 0;  // initializing the variable.
	
	nObjects = roiManager("count");
	if (nObjects > 0) {
	    for(object=0;object<nObjects;object++){
	        roiManager("select", object)
		    roiManager("Delete");
		    object--;
		    nObjects--;
	    }
	}
	nObjects = 0;
	// I initialized the roiManager. (very important)
	
	// Here I am checking which pixels are extremely likely to be background pixels, using the variance image and storing the outcome in an array which will be 
	// used in the other set of nested while loops that will come after this set of nested while loops.
	
	print("> before wand 1");
	
	selectWindow(imageTitle4);
	run("Gaussian Blur...", "sigma=2"); // Change if it doesn't work	

    // The purpose of this set of nested while loops: background/forground classification according to the variance image.
	
	pickornotArray = newArray();
	count = 0;
	while(xWand < IMAGE_X){
	    yWand = 0;
	    while(yWand < IMAGE_Y){
	        pixel = getPixel(xWand,yWand);
	       if(pixel < 10){
	           pickornotArray = Array.concat(pickornotArray, 1);
	       }
	       else {
	           pickornotArray = Array.concat(pickornotArray, 0);
	       }
	       yWand+=WAND_STEP;
	       count++;
	   }
	   xWand+=WAND_STEP;
	}
    inPrintRange = true;
    xWand = 20;
	count = 0;
	selectWindow(imageTitle2);
	countVWRuns = 0; // Counts how many times it runs the Versatile Wand until it finds the optimal tolerance.
    if(inPrintRange){
  	    print("> before wand 2");
  	    print("> wand-1: x= "+xWand+" y="+yWand);
    }

  	run("Set Measurements...", "area mean standard modal min centroid perimeter shape integrated redirect=None decimal=2"); // DECEMBER 2015 added, this should be here or even better, be global
  	
	while((xWand < IMAGE_X) && (countVWRuns < 1000)){
	    yWand = 0;
	    if(inPrintRange){
	        print("> wand-2: x= "+xWand+" y="+yWand);
	    }
	    while((yWand < IMAGE_Y)&&(countVWRuns < 1000)){
	        if(inPrintRange){
	    	    print("> wand-3: x= "+xWand+" y="+yWand+" Num runs="+countVWRuns);
	        }
	        pixel = getPixel(xWand,yWand);
		    if((pixel != 255) & (pickornotArray[count] !=0)) {
	            tolerance = 0;
	            seg_area = 0; // DECEMBER area is such a common word that it's super dangerous to use it like that
	            if (optimizedWand == 0 ) {
	                tolerAreaCountRuns = optWand(gradient,xWand,yWand,ImageTitleDotTif,imageTitle2,imageTitle3,countVWRuns,inPrintRange);
	                tolerance = tolerAreaCountRuns[0];
	                seg_area = tolerAreaCountRuns[1];
	                circularity = tolerAreaCountRuns[2];
	                returnedCountVWRuns = tolerAreaCountRuns[3];
	                countVWRuns += returnedCountVWRuns; // This is a counter. It's meaningless unless it sums up the total no. of runs needed before the opt. wand params are found.
	                if (seg_area > G_PIXELS_PER_CELL*G_PIXELS_PER_CELL*1.6){ /// 4000 worked for me, and this formula gives an outcome of 4000.
	                	VWtolerance = tolerance;
	                	// The optimized tolerance value is significant only if the area is high enough.
	                }
	                
	            } else {
	            	run("Versatile Wand", "value="+VWtolerance+" color=-100 gradient="+gradient+" connectedness=4-connected x="+xWand+" y="+yWand+" do");
	            	roiManager("Add");
	            	run("Measure");
	                seg_area=getResult("Area");
	            }
	            
	            selectWindow(imageTitle2);
	            if ((circularity<0.3) & (seg_area > (G_PIXELS_PER_CELL*G_PIXELS_PER_CELL) )) {
	                optimizedWand = 1;
	                setBackgroundColor(255,255,255); 
	                run("Clear", "slice");
	                pixel = getPixel(xWand,yWand);
	                if(inPrintRange){
	                    print("> Area of surface "+seg_area+" was deleted and pixels in that area are now set to"+pixel);
	                }
	            }
	            num = 0; // initializing num
	            num = roiManager("count");
		    }
	        yWand+=WAND_STEP;
	        count++;
	    }
		xWand+=WAND_STEP;
	}

	if(countVWRuns > 998){
		nObjects = roiManager("count");
		print("!Failed to segment image - number of runs = "+countVWRuns+": " + nostkBrtfldTitle + ". --- ROIs found:"+nObjects);
		
		if (nObjects > 0) {
	        for(object=0;object<nObjects;object++){
	            roiManager("select", object)
		        roiManager("Delete");
		        object--;
		        nObjects--;
	        }
	     }
	     // I initialized the roiManager. (very important)
	     print("Reached the end of segment cells function for: " + nostkBrtfldTitle);
	     run("Clear Results");
	     //run("Close All");
	    imgArr1 = newArray(4);
		imgArr1[0] = imageTitle;
		imgArr1[1] = imageTitle2;
		imgArr1[2] = imageTitle3;
		imgArr1[3] = imageTitle4;
		closeSelImgs(imgArr1);
	     return;
	}

	// Determine VWarea
	nObjects = 0;
	nObjects = roiManager("count");
	
	if(nObjects > 0){
	    print("> nObjects is: " + nObjects);
		if(nObjects > 1){
	    	tmpAr = newArray(nObjects);
	    	for( tmp=0; tmp < nObjects; tmp++){
	    		tmpAr[tmp]=tmp;
	    	}
	    	roiManager("Select",tmpAr);
		    roiManager("Combine");
		    roiManager("Add");
	    	roiManager("Select",tmpAr);
	    	roiManager("Delete");
	    } 
	    roiManager("Select",0);
	    run("Measure");
	    VWarea=getResult("Area");
	    
	 }  else{
	 	selectWindow(imageTitle2);
	 	makeRectangle(1, 1, 10, 10);
	 	roiManager("Add");
	 	nObjects_edl = roiManager("count");
		print("> There should be no ROI in the manager at this point and we count "+nObjects_edl);
	 	roiManager("Select",0);
	 	getRawStatistics(area, mean);
	 	VWarea=area;
	    print("> VW did not find an area to delete, so we create an artificial area in the top-left corner -- setting VWarea to "+VWarea+" which should be equal to"+area);
	    // The Versatile Wand did not create a selection so we create an artificial one with an area of 100.
	 }

	print("> VWarea="+VWarea);
     
	idealT = 0;
	
	if (VWarea > 10){
		roiManager("select", 0);
		run("Make Inverse");
		idealT = opt_threshold(imageTitle2);
		print("> The threshold used was "+idealT);
		selectWindow(imageTitle2);
		setThreshold(0, idealT);
		setOption("BlackBackground", false);
		run("Make Binary", "thresholded remaining black");
	    run("Fill Holes");
	    run("Watershed"); 
	    run("Analyze Particles...", "size=200-Infinity circularity=0.78-1.00 show=Nothing display clear record add");
	    selectWindow(imageTitle3); // DECEMBER IS IT REALLY NEEDED TO USE imageTitle3 here??? the only measurement done is area ...
	    nOK = 0;
	    nBAD=0;
	    ROIoutofBounds = 0;
	
	    nObjects = roiManager("count");
       
		print("> Segmentation returned "+nObjects+" objects");
		if(nObjects > 15000){
			print("! Segmentation returned over 15000 objects and so is likely bad");
		    run("Clear Results");
		    //run("Close All");
		    imgArr1 = newArray(4);
			imgArr1[0] = imageTitle;
			imgArr1[1] = imageTitle2;
			imgArr1[2] = imageTitle3;
			imgArr1[3] = imageTitle4;
			closeSelImgs(imgArr1);
			closeSelImgs(threshImgs);
			return;
		}
	    for (object=0; object<nObjects ; object++){
	        roiManager("Select", object);
	        run("Measure");
	        circularity=getResult("Circ.");
	        area0=getResult("Area");
	        x = 0; y = 0; width = 0; height = 0;
	        ROIoutofBounds = 0;
	        getSelectionBounds(x, y, width, height);
	        if (x + width > IMAGE_X - WAND_STEP) { 
		        ROIoutofBounds = 1;
	        }
	        if (x < WAND_STEP) { 
	        	ROIoutofBounds = 1;
	        }
	        if (y < WAND_STEP) { 
	        	ROIoutofBounds = 1;
	        }
	        if (y + height > IMAGE_X) {   
	        	ROIoutofBounds = 1;
	        }
	        if (area0 < 500 || circularity < 0.78 || ROIoutofBounds == 1) {
		        if(nObjects > 0) {
		            roiManager("Delete");
		            object--;
		            nObjects--;
		        }
		        nBAD++; 
	        } else {
		       nOK++;  // This should be used for diagnostic in a print as it fundamental to see that things add up.
	        }
	    }

		print("> There were "+nOK+" cells kept and "+nBAD+" cells removed such that there are "+nObjects+" objects left");

		nObjects_check = roiManager("count");
		print("> Verification: there are "+nObjects_check+" objects left in the ROI manager after a first size & circularity filter");

		if(nObjects > 0){
	        run("From ROI Manager");
	    }

	    selectWindow(imageTitle);	
	    run("Set Measurements...", "area mean standard modal min centroid perimeter shape integrated kurtosis redirect=None decimal=2");

        // Shrinking the ROIs and then second filtering.
	    
	    ROIstoErase = newArray();
	    nb4shrinkROI = roiManager("count");
	    timeApproximation = 0.5* nb4shrinkROI; // It should take about 0.5 seconds per cell 
	    minutes = timeApproximation/180 ;
	    roundedMin = round(minutes);
	    
	    print("> There are "+nb4shrinkROI+" cells to shrink");
	    print("> This calculation will take about " + roundedMin + " minutes");

		nROIstoErase = 0;
	    // First we adjust the ROI onto the out of focus picture
	    
	    for (object=0; object<nb4shrinkROI ; object++){       
	        shrinkROI(object); // Shrinking the ROIs 
	        ROIstoErase = Array.concat(ROIstoErase, object); // shrinkROI formed smaller ROIs, but didn't erase the original ones, that are added to a list of ROIs to delete. 
	        nROIstoErase++;
	   }
	   nAftershrinkROI = roiManager("count");
	   print("> There are "+nAftershrinkROI+" ROIs after shrinkage of which half ("+nROIstoErase+") will be erased");
   
	   if (ROIstoErase.length > 0) { // Erasing the original ROIs - the ones before the shrinking.
	   	   roiManager("Deselect");
	       roiManager("Select", ROIstoErase);
	       roiManager("Delete");
	   }

		nObjects = roiManager("count");
	   if(nObjects>0){
		   for (object=0; object<nObjects ; object++){ // Checking the area and circularity again after the size of the ROIs was altered.
				roiManager("Select", object);
				run("Measure");
				postShrinkarea=getResult("Area");
				postShrinkcirc=getResult("Circ.");
				if ((postShrinkarea < 500) || (postShrinkcirc < 0.78)) {
				    roiManager("Delete");
				    object--;
				    nObjects--;
				}
		    }
	   }
		print("> Final size and circularity filter left "+nObjects+" cells"); 
	   
		// Second we translate the ROIs to maximize fluorescence
		if(CHANNELS.length > 1){
			selectWindow("CH1");  
			nObjects = roiManager("count");
			if(nObjects>0){
			   for (object=0; object<nObjects ; object++){
					translateROI(object);
			   }
			}
		}
		imgArr1 = newArray(4);
		imgArr1[0] = imageTitle;
		imgArr1[1] = imageTitle2;
		imgArr1[2] = imageTitle3;
		imgArr1[3] = imageTitle4;
		closeSelImgs(imgArr1);
		run("Clear Results");
	    if(CHANNELS.length > 1){
	        selectWindow("CH1");
	        close();
	    }
	    print("Attempting to open image: " + dir+imageName);
	    open(dir+imageName);
	    selectWindow(imageName);
	    nObjects = roiManager("count");
	    if(nObjects > 0){
	        run("From ROI Manager");
	    }
	    
	    run("Labels...", "color=blue font=14 show bold");
	    dirAndimageTitleprocstk = dir + nostkBrtfldTitle + "-0001" + "procstk" ;
	    imageTitleprocstk = nostkBrtfldTitle + "-0001" + "procstk";
	    print("> Before the save command of the -0001procstk image.");
	    if((boolStk==true) && ((nObjects > 0))){ // If it's a stack, I want the overlay to be associated with all slices, so remove slice info does that. 
	    	run("To ROI Manager");
	    	roiManager("remove slice info");
	    	run("From ROI Manager");
	    }
	    saveAs("Tiff", dirAndimageTitleprocstk);
	    run("Image Sequence... ", "format=TIFF name=imageTitleprocstk start=1 save=[dir]");

	} 

	nObjects = roiManager("count");
    if (nObjects > 0) {
        for(object=0;object<nObjects;object++){
            roiManager("select", object)
    	    roiManager("Delete");
    	    object--;
    	    nObjects--;
        }
     }
     
     nObjects = 0;
     // I initialized the roiManager. (very important)
     print( "Reached the normal end of segment cells function for: " + nostkBrtfldTitle);
     run("Clear Results");
     //run("Close All"); Closing all images will result in a bug - only closing selected images.
     imgArr1 = newArray(4);
	 imgArr1[0] = imageTitle;
	 imgArr1[1] = imageTitle2;
	 imgArr1[2] = imageTitle3;
	 imgArr1[3] = imageTitle4;
	 closeSelImgs(imgArr1);
}

function getSnum(listSTK){
	//print("listSTK is: " + listSTK);
	indxOf = indexOf(listSTK, "Brightfield_");
	// There are 12 letters in "Brightfield_" to add to indxOf in order to get to the beginning of snum.
	snumDotSTK = substring(listSTK, indxOf + 12);
	snumDotSTKParts = split(snumDotSTK,'(.stk)');
    snum4sort = snumDotSTKParts[0];
	return snum4sort;
}



function initialize_process(){
	run("Clear Results");
	run("Close All");
	nObjects = roiManager("count");
    if (nObjects > 0) {
        for(object=0;object<nObjects;object++){
            roiManager("select", object)
    	    roiManager("Delete");
    	    object--;
    	    nObjects--;
        }
    }
}

function checkSpacesinTitle(cst_imageName){
    cst_imageNameSplit = split(cst_imageName, " ");
    cst_numberofSpaces = cst_imageNameSplit.length - 1;
    if(cst_numberofSpaces > 0){
	    print("Renaming image :" + cst_imageName + " spaces were replaced by underscores");
        cst_imageName = spacestoUnderscores(cst_imageNameSplit);
    }    
    return cst_imageName;
}


function spacestoUnderscores(imageNameSplit){
	nameSum = "";
	for(i = 0; i < imageNameSplit.length;i++){
		if(i < imageNameSplit.length - 1){
			nameSum = nameSum + imageNameSplit[i] + "_";
		}
		else{
			nameSum = nameSum + imageNameSplit[i];
		}
	}
	return nameSum;
}

function sortArrayandIndex(array1){ // sorts the array in ascending order and returns the indexes with respect to the original array. 
    indexArray = newArray(array1.length);
    for(i=0;i<array1.length;i++){
    	indexArray[i] = i;
    }
    for (i = 0; i < array1.length; i++){
        for (j = i + 1; j < array1.length; j++){
            if (array1[i] > array1[j]){
                temp = array1[j];
                array1[j] = array1[i];
                array1[i] = temp;

                tempIndex = indexArray[j];
                indexArray[j] = indexArray[i];
                indexArray[i] = tempIndex;
            }
        }
     }
     return indexArray;    
}

function customBrightnessContrast(IMAGE_X,IMAGE_Y){
    histWidthQuarters = newArray(4);
    histWidthQuarters[0] = rectHist(1,IMAGE_X,IMAGE_Y);
    histWidthQuarters[1] = rectHist(2,IMAGE_X,IMAGE_Y);
    histWidthQuarters[2] = rectHist(3,IMAGE_X,IMAGE_Y);
    histWidthQuarters[3] = rectHist(4,IMAGE_X,IMAGE_Y);

    minIndex = 0;
    minHistWidth = histWidthQuarters[0];
    for (j = 1; j < 4; j++){
        if (histWidthQuarters[j] < minHistWidth) {
            minHistWidth = histWidthQuarters[j];
            minIndex = j;
        }
    } 

    bestQuarter = minIndex + 1;

    histWidthEighths = newArray(4);
    histWidthEighths[0] = rectHist2(1,bestQuarter,IMAGE_X,IMAGE_Y);
    histWidthEighths[1] = rectHist2(2,bestQuarter,IMAGE_X,IMAGE_Y);
    histWidthEighths[2] = rectHist2(3,bestQuarter,IMAGE_X,IMAGE_Y);
    histWidthEighths[3] = rectHist2(4,bestQuarter,IMAGE_X,IMAGE_Y);

    minIndex = 0;
    minHistWidth = histWidthEighths[0];
    for (j = 1; j < 4; j++){
        if (histWidthEighths[j] < minHistWidth) {
            minHistWidth = histWidthEighths[j];
            minIndex = j;
        }
    } 

    chooseROI = minIndex + 4;
    roiManager("Select", chooseROI);
    run("Enhance Contrast", "saturated=0.35");
    makePoint(777, 639); // This is so that the ROI will not be displayed.
    roiManager("Deselect");
    roiManager("Delete");
}

function rectHist(quarterNum,IMAGE_X,IMAGE_Y){ // Takes a no. between 1-4 and returns the corresponding image patch quarter's histogram width. (the patch is a quarter of the whole image)
	                           // It will add the quarter image patch to the ROI manager.
    if(quarterNum == 1){
        x=0;
        y=0;
    }
    else if(quarterNum == 2){
        x=IMAGE_X/2;
        y=0;
    }
    else if(quarterNum == 3){
        x=IMAGE_X/2;
        y=IMAGE_Y/2;
    }
    else{
        x=0;
        y=IMAGE_Y/2;
    }
    width = IMAGE_X/2;
    height = IMAGE_Y/2;
    makeRectangle(x, y, width, height);
    run("ROI Manager...");
    roiManager("Add");
    getHistogram(values,counts,256);
    histMin = values[0];
    binWidth = values[1] - values[0];
    histMax = values[0] + 256*binWidth; 
    histWidth = histMax - histMin;
    return histWidth;
}

function rectHist2(quarterNum,bestQuarter,IMAGE_X,IMAGE_Y){ // We want to divide the selected image patch - given by an index between 1-4 (which is a quarter). This is called bestQuarter.
	// It will return the histogram width of a fourth of this quarter. The fourth will be chosen by us - we have to choose quarterNum (1-4).
	// Divides the best image quarter to quarters, which are each 1/16 of the whole image. It will add the ROI to the manager.
	deltax = 0;
	deltay = 0;
    if(bestQuarter == 1){
        deltax=0;
        deltay=0;
    }
    else if(bestQuarter == 2){
        deltax=IMAGE_X/2;         // XXX ALL VALUES HERE SHOULD BE RELATIVE TO CONSTANTS
        deltay=0;
    }
    else if(bestQuarter == 3){
        deltax=IMAGE_X/2;
        deltay=IMAGE_Y/2;
    }
    else{
        deltax=0;
        deltay=IMAGE_Y/2;
    }

	
    if(quarterNum == 1){
        x=0+deltax;
        y=0+deltay;
    }
    else if(quarterNum == 2){
        x=IMAGE_X/4+deltax;
        y=0+deltay;
    }
    else if(quarterNum == 3){
        x=IMAGE_X/4+deltax;
        y=IMAGE_Y/4+deltay;
    }
    else{
        x=0+deltax;
        y=IMAGE_Y/4+deltay;
    }
    width = IMAGE_X/4;
    height = IMAGE_Y/4;
    makeRectangle(x, y, width, height);
    run("ROI Manager...");
    roiManager("Add");
    getHistogram(values,counts,256);
    histMin = values[0];
    binWidth = values[1] - values[0];
    histMax = values[0] + 256*binWidth; 
    histWidth = histMax - histMin;
    return histWidth;
}

function optWand(gradient,xWand,yWand,imageTitle,imageTitle2,imageTitle3,ow_countVWRuns,inPrintRange){
    /*
    This function's goal is to look for the optimal tolerance value that should be used with the Versatile Wand.
    */
    selectWindow(imageTitle2);
    valToler = 40; //                 This is the tolerance at the beginning of the while loop
    previousPerimeter = 10000000000; // just a random value that will be larger than any perimeter
    deltaPerimeter = 305; // intialize it to something that won't prevent the while loop from starting to run
                          // DECEMBER whenever possible thresholds should be RELATIVE, NOT ABSOLUTE values.
    
    // I initialized the roiManager. (very important)
    run("Versatile Wand", "value="+(valToler-10)+" color=1 gradient="+gradient+" connectedness=4-connected x="+xWand+" y="+yWand+" do");
    run("Measure");
    ow_countVWRuns = ow_countVWRuns + 1;
    ow_area=getResult("Area");               
    perimeter=getResult("Perim.");
    tolerB4while = valToler;                 // This will help determine the maximal no. of runs possible, in order to know if optWand converged or not.
    convergence = 2;                // I use a percentage. I an area is 3000000, 300 is 0.01% change ... this is way too low
    countRuns = 0;
    maxToler = 150;
    maxNoofRuns = (maxToler - tolerB4while)/10;
    if(inPrintRange){
        print(" > In optWand, the maxNoofRuns is"+maxNoofRuns);
    }
    deltaPerimeters = newArray(maxNoofRuns);
    valTolerences = newArray(maxNoofRuns);
    rankPositions = newArray(maxNoofRuns);
    ow_area = 0; // initializing the area
    
    // This while loop makes the perimeter smaller. Convergence is achieved when the perimeter changes in less than 300 from its previous value.
    // The tolerance value in which the perimeter doesn't change anymore is found.
    while( abs(deltaPerimeter) > convergence &&  valToler < maxToler  ){
        run("Versatile Wand", "value="+valToler+" color=1 gradient="+gradient+" connectedness=4-connected x="+xWand+" y="+yWand+" do");
        run("Measure");
        ow_countVWRuns = ow_countVWRuns + 1;
        ow_area=getResult("Area");
        previousPerimeter = perimeter;
        perimeter=getResult("Perim.");
        if(perimeter==0){
        	deltaPerimeter=0;
        } else {
        	deltaPerimeter = (perimeter - previousPerimeter)/perimeter;
        }
        deltaPerimeters[countRuns] = abs(deltaPerimeter);
        valTolerences[countRuns] = valToler;
        valToler = valToler + 10;
        countRuns++;
    }
    
    if(ow_area < 10) {
        	valToler = 0;
        	toleranceAreaCountRuns = newArray(4);
        	toleranceAreaCountRuns[0] = valToler;
        	toleranceAreaCountRuns[1] = ow_area;
            toleranceAreaCountRuns[2] = 0;
            toleranceAreaCountRuns[3] = ow_countVWRuns;
            roiNum = 0;
            roiNum = roiManager("count");
        	return toleranceAreaCountRuns;
        	// If the ow_area is zero, the tolerance value is set to zero and everything else in toleranceAreaCountRuns is also returned as zero.
    }
    
    if ((countRuns > 0) && (countRuns != maxNoofRuns)){ // Add the ROI if convergence was reached.
        // The color in Versatile Wand should be -100 for grayscale images.
         valToler = valToler - 15; // The convergence is checked for the previous valToler value. (before it was incremented) So actually, the convergence
         // the two best tolerance values are: valToler - 10 and valToler - 20. Averaging them gives valToler - 15.
         run("Versatile Wand", "value="+valToler+" color=-100 gradient="+gradient+" connectedness=4-connected x="+xWand+" y="+yWand+" do");
         roiManager("Add");
         ow_countVWRuns = ow_countVWRuns + 1;
    } else {
	    ow_minIndex = 0;
        minDelta = 1000000000; // Initial value should be very high, so that it'll be changed in the loop
	    // if convergence wasn't reached, the optimal tolerance value will be set to the one with the smallest change in perimeter.
	    //  DECEMBER WHY smallest change in perimeter? And not the largest area for example? Because when the optimal conditions are reached, things stabilize and
	    // stop changing. Also, the perimeter is extremely high when we're far from the threshold value, because there are lots of little dots.
	                            
	    nObjects = 0;
	    for (i = 0; i < maxNoofRuns ; i++){
		
            if (deltaPerimeters[i] < minDelta) {
        	    minDelta = deltaPerimeters[i];
        	    ow_minIndex = i;
            } 
	    }
	    if(inPrintRange){
	        print(">! Convergence wasn't reached with min delta being "+minDelta+" Last area was "+ow_area+" picked a tolerance of "+valToler+" and a gradient of "+gradient+" at position "+xWand+"-"+yWand);
	    }
	    valToler = valTolerences[ow_minIndex];
	    run("Versatile Wand", "value="+valToler+" color=-100 gradient="+gradient+" connectedness=4-connected x="+xWand+" y="+yWand+" do");
	    roiManager("Add");
	     ow_countVWRuns = ow_countVWRuns + 1; 
    }
    toleranceAreaCountRuns = newArray(4);
    nObjects = roiManager("count");
    indexes = newArray(nObjects);
    toleranceAreaCountRuns[0] = valToler;
    roiManager("select", nObjects-1);     	         
    run("Measure");
    ow_area=getResult("Area");
    circularity=getResult("Circ.");
    if(inPrintRange){
        print("> Inside optWand - nObjects = "+nObjects+" - Circ = "+circularity+" deltaPerimeter="+deltaPerimeter+" coutRuns="+countRuns+" Last area was "+ow_area+" picked a tolerance of "+valToler+" and a gradient of "+gradient+" at position "+xWand+"-"+yWand);
    }
    toleranceAreaCountRuns[1] = ow_area;
    toleranceAreaCountRuns[2] = circularity;             
    toleranceAreaCountRuns[3] = ow_countVWRuns;
    return toleranceAreaCountRuns;
}

function opt_threshold(imageTitle2){
    Tarray = newArray(10);
    nROIsarray = newArray(10);
    percentVal = 0;
    newT = 0;
    for(t = 0; t < 10; t++){
       percentVal = 10*t;
       IJ.log("Sending the following percentVal value to threshfromPercentage: " + percentVal);
       newT = threshfromPercentage(percentVal,imageTitle2);
       Tarray[t] = newT;
       IJ.log("Trying threshval: " + newT);
       nROIsarray[t] =  tryThreshVal(imageTitle2,newT);
    }
    maxI = 0;
    nmaxROIs = 0;
    for (j = 0; j < nROIsarray.length; j++){
       if (nROIsarray[j] > nmaxROIs) {
          nmaxROIs = nROIsarray[j];
          maxI = j;
       }
    } 
    ot_idealT = Tarray[maxI]; // Use the ideal threshold value
    print("> The ideal threshold is: " + ot_idealT);
    nROIsinManager = roiManager("count");
    eraseROIs = newArray(nROIsinManager - 1);
    for(s=1;s<nROIsinManager;s++){
       eraseROIs[s-1] = s; // delete all ROIs in the ROI manager except for the first one.
    }
    if (eraseROIs.length > 0) {
       roiManager("Deselect");
	   roiManager("Select", eraseROIs);
	   roiManager("Delete");
    }
    
    threshImgs = newArray(10);
    nm = 0;
    for(i = 0; i < 10; i++){
       Ti =  Tarray[i];
       thrshImg = 'thresh_'+Ti+"_"+1;
       threshImgs[i] = thrshImg;
    }
    closeSelImgs(threshImgs);
    return ot_idealT;
}

function tryThreshVal(imageTitle2,T){
	if (VWarea > 0){ 
	    selectWindow(imageTitle2);
	    run("Duplicate...", 'title=thresh_'+T+"_"+1);
	    threshImage = 'thresh_'+T+"_"+1;
	    selectWindow(threshImage);
	    nb4Thresh = roiManager("count"); 
	    
	    setThreshold(0,T);
	    getThreshold(lower, upper);
        setOption("BlackBackground", false);
        run("Make Binary", "thresholded remaining black");
        run("Fill Holes");
        run("Watershed");
        roiManager("Deselect");
        run("Analyze Particles...", "size=1000-2500 circularity=0.8-1.00 display add");
        nafterThresh = roiManager("count");
        numROIstoDelete = nafterThresh - nb4Thresh;
        nROIs = numROIstoDelete;
        DeleteThreshROIs = newArray(numROIstoDelete);
        for(i=1; i < numROIstoDelete + 1; i++){
            DeleteThreshROIs[i-1] = i;
        }
        if (DeleteThreshROIs.length > 0) {
           roiManager("Deselect");
	       roiManager("Select", DeleteThreshROIs);
	       roiManager("Delete");
        }
    	close(); 
    }
    
    return (nafterThresh - nb4Thresh);
}


function threshfromPercentage(percentVal,imageTitle2){
    selectWindow(imageTitle2);
    roiManager("select", 0);  
    getStatistics(area, mean);
    run("Set Measurements...", "modal median");
	List.setMeasurements();
	mode = List.getValue("Mode");
	median = List.getValue("Median"); 
    if(mode == 255){ // This is white for 8-bit, would have to be changed if it's 16-bit
		run("Make Inverse");  
    }
    var final_i = 0;
    var sum = 0;
    var nBins = 256;
    resetMinAndMax();
    getHistogram(values, counts, nBins);
    // find culmulative sum
    var Xminhist = values[0];
    var Xmaxhist = values[255];
    var binWidth = (Xmaxhist - Xminhist)/255;
    nPixels = 0;
    percentage = newArray(counts.length);
    for (i = 0; i<counts.length; i++){
        nPixels += counts[i];
    }
    for (i = 0; i<256; i++){
	    sum = sum + counts[i];
	    percentage[i] = sum*100/nPixels;
	    if (percentage[i] > percentVal) {
		    final_i = i;
		    i = 999999;
	    }
    }
    return Xminhist + binWidth*final_i;
}


function shrinkROI(index) {
    // Remove scale, don't use Gaussian blur. Otherwise it won't work.
    // The segmented ROI will be the last ROI in the ROI manager and the previous (not well segmented) ROI will not be erased.
    roiIndex = index; // The index of the ROI we want to process. 

    initial_n = roiManager("count"); // This won't change, as opposed to n.
    n = roiManager("count");

	// First we 
	NITER = 6;
	NDIFF = NITER-1;
	NDERIV= NITER-2;
	
    meanIntROI = newArray(NITER);
    areaROI = newArray(NITER);
    areaTimesMean = newArray(NITER);
    areaDiff = newArray(NDIFF);
    areaTimesMeanDiff = newArray(NDIFF);
    meanIntBand = newArray(NDIFF);
    derivativeofInt = newArray(NDERIV);
    
    roiManager("Select", roiIndex); // duplicate the ROI that we want to shrink
    roiManager("Add");
    n = roiManager("count"); // Update n

    i = 0;
    roiManager("Select", (initial_n + i));
    run("Enlarge...", "enlarge=2"); // The first ROI is the enlarged ROI, and the first element in each of the arrays: meanIntROI, areaROI and areaTimesMean                                 // is generated here
    roiManager("Update");           // DECEMBER The difference should be the same between all ROIs and +2 -2 = 4 whereas all other 
    getStatistics(area, mean);
    
    meanIntROI[i] = mean;
    areaROI[i] = area;
    areaTimesMean[i] = mean*area;
    roiManager("Deselect");
     
    for (i=0; i < NDIFF; i++) { // The last 6 array elements for meanIntROI, areaROI and areaTimesMean arrays are generated here.
        roiManager("Select", (initial_n + i));
        run("Enlarge...", "enlarge=-2");
        roiManager("Add");
        getStatistics(area, mean);
        meanIntROI[i + 1] = mean;
        areaROI[i + 1] = area;
        areaTimesMean[i + 1] = mean*area;
    }
        
    for (j=0; j < NDIFF; j++) { // j compares i to i - 1
        areaDiff[j] = areaROI[j] - areaROI[j+1];
        areaTimesMeanDiff[j] = areaTimesMean[j] - areaTimesMean[j+1];
        meanIntBand[j] = areaTimesMeanDiff[j]/areaDiff[j];
    }    

    for (i=1; i < NDIFF; i++) {  
        derivativeofInt[i-1] = meanIntBand[i-1] - meanIntBand[i]; // starts large in white, and shrinks in black so large value indicates border
    }
    
    maxIndex = 0;
    max = 0;
    for (j = 0; j < NDERIV ; j++){
       if (derivativeofInt[j] > max) {
           max = derivativeofInt[j];
           maxIndex = j;
       }
    } 

	if(maxIndex == (NDERIV-1)){
		print(">! The best shrink for ROI "+index+" was the maximal value "+maxIndex+" consider incresing the search range");
	}
    bestROINum = maxIndex + 2; // Plus 2 is because there is one outer band and because we're always comparing i to i+1. 
    ROIfromManager = bestROINum + initial_n; // initial_n - 1 is the no. of ROIs that have nothing to do with this function, plus one that we duplicated.

    final_n = roiManager("count");

	if(index < 5){
		print("> selecting the best shrink for ROI "+index+" - chose "+maxIndex+"\tAt the begining there were "+initial_n+" and at the end "+final_n);
	} else {
		//exit();
	}
    ROIstoDelete = final_n - initial_n - 1;
    selectAndDelete = newArray(ROIstoDelete);
    count = 0;
    for (i = 0; i < final_n; i++){
    	if ((i > initial_n - 1) && (i != ROIfromManager)) {
            selectAndDelete[count] = i;
    		count++;
    	}
    }
    roiManager("Deselect");
    roiManager("select", selectAndDelete);
    roiManager("Delete");

	final_n = roiManager("count");

 	//print("At the end of ROI Shrink there are "+final_n+" ROIs");
 }

 function translateROI(index) {
    // The out of focus picture in the in focus pictures are not always perfectly matching (i.e., the out of focus can introduce a shift)
    // Therefore we ned to realign the ROI 
    // For this we use the fluorescent chanel and miximize the fluo inside the ROI
      
    roiManager("Select", index); // duplicate the ROI that we want to shrink

	Roi.getBounds(x, y, width, height);
	xOri = x;
	yOri = y;
	NSTEPS = 4;
    bestX=0;
    bestY=0;
    bestMean=0;
    
	for(tx=-NSTEPS; tx <= NSTEPS; tx++){

		for(ty=-NSTEPS; ty <= NSTEPS; ty++){
	
			Roi.move(xOri+tx, yOri+ty);
			getRawStatistics(area, mean);
	 		if(mean > bestMean){	// Move the ROIs to maximize the mean intensity, no more than 4 pixels up, down, left and right.	
	 			bestMean=mean;
	 			bestX=tx;
	 			bestY=ty;
	 		}
		}
	}
 
	Roi.move(xOri+bestX, yOri+bestY);
	roiManager("Update");  
    roiManager("Deselect");
 }

 function closeSelImgs(imgArr){
 	for(imgN = 0; imgN< imgArr.length;imgN++){
 		boolOpen = isOpen(imgArr[imgN]);
 		if(boolOpen){
 			selectWindow(imgArr[imgN]);
	    	close();
 		}
 	}
 }

