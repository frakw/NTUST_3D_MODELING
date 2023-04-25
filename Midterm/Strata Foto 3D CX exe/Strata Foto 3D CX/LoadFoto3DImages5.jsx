// (c) Corastar Inc. 2007, (c) Creative Dimension Software Ltd 2007
// portions of this script are base on "Load Images into Stack.jsx" (c) Copyright 2006.  Adobe Systems, Incorporated.  All rights reserved.
// requires "Stack Scripts Only" subdirectory installed with Adobe Photoshop CS3

/*
@@@BUILDINFO@@@ Load Foto 3D Images into Stack.jsx 1.0.0.0
*/

//
// Load Foto 3D Images into Stack.jsx - loads the images in a stack but also fetches camera data and stores in layer name
//

/*

// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
<name>$$$/JavaScripts/LoadFoto3DImagesintoStack5/Menu=Foto 3D Load Input Photos into Stack...</name>
<about>$$$/JavaScripts/LoadFoto3DImagesintoStack5/About=Load Foto 3D Images into Stack ^r^rCopyright 2006-2007.^r^rLoads multiple Foto 3D input images into a stack object with relevant camera data (full version).</about>
</javascriptresource>

// END__HARVEST_EXCEPTION_ZSTRING

*/

// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
//$.level = (Window.version.search("d") != -1) ? 1 : 0;	// This chokes bridge
$.level = 0;

// debugger; // launch debugger on next line

// on localized builds we pull the $$$/Strings from a .dat file
$.localize = true;

// Put header files in a "Stack Scripts Only" folder.  The "...Only" tells
// PS not to place it in the menu.  For that reason, we do -not- localize that
// portion of the folder name.
var g_StackScriptFolderPath = app.path + "/"+ localize("$$$/ScriptingSupport/InstalledScripts=Presets/Scripts") + "/"
										+ localize("$$$/Private/LoadStack/StackScriptOnly=Stack Scripts Only/");
$.evalFile(g_StackScriptFolderPath + "LatteUI.jsx");

$.evalFile(g_StackScriptFolderPath + "StackSupport.jsx");


/************************************************************/
//
// Prototype classes for creating image stacks.
//

// on localized builds we pull the $$$/Strings from a .dat file
$.localize = true;

const kUserCanceledError = 8007;
const kFilesFromPMLoad = 1233;
const kErrTempDiskFull = -25010; // happens when scratch disk is full

/************************************************************/
// StackElement class.
//
// A StackElement is the ES equivalent of "PSPiece", and holds
// all the info need to pass the document's metadata to the filter plugin
//

// Constructor
function StackElement( f )
{
	this.file = f;
	this.fName = decodeURI(f.name);
	this.fFullName = this.file.path + "/" + this.file.name;
	this.fAlreadyOpen = false;
	this.fPSDoc = null;
	this.fExposure = 0.0;
	this.fAperture = 0.0;
	this.fISOValue = 0;
	this.fCameraID = "UNKNOWN_CAMERA";
	this.fFocalLength = 0.0;
	this.fCCD = 0.0;
	this.fMake = "";
	this.fModel = "";

	// Keep track of documents that were already open, so we don't close them
	var i;
	for (i = 0; i < app.documents.length; ++i)
	{
		var curName = null;
		try {
			// This fails if it's not saved.
			curName = app.documents[i].fullName;
		}
		catch (err) {
			continue;
		}
		if ((this.fFullName) == curName)
		{
			// Must also set these here, because silentOpen isn't called.
			this.setDocParams( app.documents[i] );
			this.fAlreadyOpen = true;
			break;
		}
	}
}

StackElement.prototype.setDocParams = function( srcDoc )
{
	this.fPSDoc = srcDoc;
	this.fWidth = this.fPSDoc.width.as("px");	
	this.fHeight= this.fPSDoc.height.as("px");
}

// The standard open insists on a dialog, so we roll our own.
StackElement.prototype.silentOpen = function( linearizeCameraRaw )
{
	const eventOpen				= app.charIDToTypeID('Opn ');
	const keyCamRawReadLinear	= app.charIDToTypeID('EmCr');
	const kReadLinearRegEntry	= "EM_CR_ReadLinearCameraDataEntry";
	
	// Need to set registry Entry EM_CR_ReadLinearCameraDataEntry, key 'EmCr',
	// to "true" during the open, then set it back to "false" afterwords, 
	// so Camera Raw linearizes luminance parameters and does not auto-correct (or prompt!) for them
	function setCamRawLinearFlag( flagvalue )
	{
		var crDesc = new ActionDescriptor();
		crDesc.putBoolean( keyCamRawReadLinear, flagvalue );
		app.putCustomOptions( kReadLinearRegEntry, crDesc, false );
		if (! flagvalue)
			app.eraseCustomOptions( kReadLinearRegEntry );	// Really nuke it
	}

	// Just return it if it's already open
	if (this.fAlreadyOpen)
		return this.fPSDoc;
		
	var status, oldActiveDoc = (app.documents.length > 0) ? app.activeDocument : null;
	var savedCamRawJPEGPreference = getUseCameraRawJPEGPreference();
	var desc = new ActionDescriptor();
	desc.putPath( typeNULL, new File( this.file ) );

	try {
		if (linearizeCameraRaw)
		{
			setCamRawLinearFlag( true );
			setUseCameraRawJPEGPreference( false );
		}
		status = executeAction( eventOpen, desc, DialogModes.NO );
		// On normal open status has a typeNULL key, but if it fails, it's
		// empty.  This seems to be our only clue you've whacked the escape key.
		if (status.count == 0)
			throw Error( kUserCanceledError );
	}
	catch (err)
	{
		setCamRawLinearFlag( false );
		setUseCameraRawJPEGPreference( savedCamRawJPEGPreference )
		if (err.number == kErrTempDiskFull) {
			this.scratchDiskFullAlert();
			throw err;
		}
		else if (err.number == kUserCanceledError)
			throw err;
		return null;
	}
	
	setCamRawLinearFlag( false );
	setUseCameraRawJPEGPreference( savedCamRawJPEGPreference )

	// Check to see if the open failed (this is the only way??)
	if ((app.documents.length == 0) || (oldActiveDoc == app.activeDocument))
		return null;
		
	this.setDocParams( app.activeDocument );	
	return this.fPSDoc;
}

// reuse "^0" string as extendScript "%1" string
StackElement.prototype.scratchDiskFullAlert = function()
{
	var requestStr = "$$$/Messages/Anonymous=Could not complete your request ^0.";
	var strArr = requestStr.split("^0");
	if (strArr.length == 2) {
		requestStr = strArr[0] + "%1" + strArr[1];
	}
	alert(localize(requestStr,localize("$$$/ErrorStrings/ScratchFull=because the scratch disks are full")));
}

StackElement.prototype.closeDocIfNotAlreadyOpen = function ()
{
	if (this.fPSDoc && (! this.fAlreadyOpen))
	{
		this.fPSDoc.close(SaveOptions.DONOTSAVECHANGES);
		this.fPSDoc = null;
	}
}

// Stash the document's EXIF data, cleaning it up as we go.
StackElement.prototype.setupEXIFData = function ()
{
	// From ExifTags.h
	const EXIFTAG_ISOSPEEDRATINGS 			= 34855;
	const EXIFTAG_FNUMBER 				= 33437;
	const EXIFTAG_APERTUREVALUE			= 37378;
	const EXIFTAG_EXPOSURETIME 			= 33434;
	const EXIFTAG_SHUTTERSPEEDVALUE			= 37377;
	const EXIFTAG_MAKE				= 271;
	const EXIFTAG_MODEL				= 272;
	const EXIFTAG_SOFTWARE				= 305;
	const EXIFTAG_FOCALLENGTH			= 37386;
	const EXIFTAG_FOCALLENGTHIN35			= 41989;
	const EXIFTAG_PIXELXDIMENSION			= 40962;
	const EXIFTAG_PIXELYDIMENSION			= 40963;
	const EXIFTAG_FOCALPLANEXRESOLUTION		= 41486;
	const EXIFTAG_FOCALPLANEYRESOLUTION		= 41487;
	const EXIFTAG_FOCALPLANERESOLUTIONUNIT		= 41488;
	
	// Shutter speeds are given in "convenient" units, but
	// they should really be powers of 2 (i.e., 1/500 -> 1/512)
	// On fancy cameras, long times have 1/3 stop intervals, which work
	// out to 2^((1/3)*i) steps.  We've included a few of these that
	// would be egregiously wrong otherwise.
	var shutterSrc = [ 1/8000.0, 1/4000.0, 1/2000.0, 1/1000.0, 1/500.0, 1/250.0, 1/125.0, 1/60.0, 1/30.0, 1/15.0, 6.0,    13.0,    15.0, 20.0,    25.0,    30.0, 60.0];
	var shutterDst = [ 1/8192.0, 1/4096.0, 1/2048.0, 1/1024.0, 1/512.0, 1/256.0, 1/128.0, 1/64.0, 1/32.0, 1/16.0, 6.3496, 12.6992, 16.0, 20.1587, 25.3984, 32.0, 64.0];
	// Likewise, fStops are given in "convenient" units, but are really sqrt(2^i) steps.
	var srcfStop = [ 1.0, 1.4, 2.0, 2.8, 4.0, 5.6, 8.0, 11.0, 16.0, 22.0, 32.0, 45.0, 64.0 ];
	var dstfStop = [];	// Set up below as f[i] = sqrt(2^i)

	var unitSrc = [ "Inch", "Inches", "mm", "cm", "m" ];
	var unitDst = [ 25.4, 25.4, 1.0, 10.0, 1000.0 ];
	

	function fixValue( x, src, dst )
	{
		var j;
		for (j in src)
			if (src[j] == x) return dst[j];
		return x;	// No match
	}

	// Must pass in the exifData as a param, because nested function can't see "this"
	function parseExifNum( exifKey, regexp, exifTable )
	{
		if (exifKey in exifTable)
			return eval(exifTable[exifKey].match(regexp)[1]);
		else
			return 0;
	}
	
	function exifString( exifKey, exifTable )
	{
		if (exifKey in exifTable)
			return exifTable[exifKey];
		else
			return "";
	}
	
	// Skip if no EXIF data
	if (this.fPSDoc.info.exif[0] != undefined)
	{
		var i;
		for (i in srcfStop)
			dstfStop[i] = Math.sqrt(Math.pow( 2.0, i ));
	
		// Extract the EXIF data into an asssociative array
		this.exifData = new Array();
		var p;
		for (p in this.fPSDoc.info.exif)
			this.exifData[this.fPSDoc.info.exif[p][2]] = this.fPSDoc.info.exif[p][1];

		// Minolta only supports shutter speed
		if (typeof(this.exifData[EXIFTAG_EXPOSURETIME]) != "undefined")
			this.fExposure = fixValue( parseExifNum(EXIFTAG_EXPOSURETIME,		/([\d\/.]+)/,  this.exifData), shutterSrc, shutterDst );
		else
			this.fExposure = fixValue( parseExifNum(EXIFTAG_SHUTTERSPEEDVALUE,	/([\d\/.]+)/,  this.exifData), shutterSrc, shutterDst );
		this.fISOValue = 			   parseExifNum(EXIFTAG_ISOSPEEDRATINGS,	/(\d+)/, 		 this.exifData );
		
		this.fCameraID	= exifString( EXIFTAG_MAKE, this.exifData ) + "-" 
							+ exifString( EXIFTAG_MODEL, this.exifData );
		this.fMake = exifString(EXIFTAG_MAKE, this.exifData);
		this.fModel = exifString(EXIFTAG_MODEL, this.exifData);
		
		// read the focal length
		if (EXIFTAG_FOCALLENGTHIN35 in this.exifData)
		{
			// we have a 35 mm equivalent focal length
			this.fFocalLength = parseExifNum( EXIFTAG_FOCALLENGTHIN35, /\D*([\d.]+)/, this.exifData);
		 	this.fCCD = 35.0;
		}
		else if (EXIFTAG_FOCALLENGTH in this.exifData)
		{
			this.fFocalLength = parseExifNum( EXIFTAG_FOCALLENGTH, /\D*([\d.]+)/, this.exifData);

			var xres, yres, resunit, xdim, ydim;
			var ccd_width = 0.0, ccd_height = 0.0;
			
			if ((EXIFTAG_PIXELXDIMENSION in this.exifData) &&
				(EXIFTAG_FOCALPLANEXRESOLUTION in this.exifData) &&
				(EXIFTAG_FOCALPLANERESOLUTIONUNIT in this.exifData))
			{
				xdim = parseExifNum( EXIFTAG_PIXELXDIMENSION, /\D*([\d.]+)/, this.exifData);
				xres = parseExifNum( EXIFTAG_FOCALPLANEXRESOLUTION, /\D*([\d.]+)/, this.exifData);
				resunit = fixValue(this.exifData[EXIFTAG_FOCALPLANERESOLUTIONUNIT], unitSrc, unitDst);
				ccd_width = xdim * resunit / xres;
			}	 

			if ((EXIFTAG_PIXELYDIMENSION in this.exifData) &&
				(EXIFTAG_FOCALPLANEYRESOLUTION in this.exifData) &&
				(EXIFTAG_FOCALPLANERESOLUTIONUNIT in this.exifData))
			{
				ydim = parseExifNum( EXIFTAG_PIXELYDIMENSION, /\D*([\d.]+)/, this.exifData);
				yres = parseExifNum( EXIFTAG_FOCALPLANEYRESOLUTION, /\D*([\d.]+)/, this.exifData);
				resunit = fixValue(this.exifData[EXIFTAG_FOCALPLANERESOLUTIONUNIT], unitSrc, unitDst);
				ccd_height = ydim * resunit / yres;
			}	 
			
			if (ccd_height > ccd_width) ccd_width = ccd_height;
			this.fCCD = (Math.floor(0.5+1000.0*ccd_width)) / 1000.0;
		}

		// Aperture is messy.  Not all cameras report both, and Photoshop trashes the
		// aperture value back into an F-Number, even though it's not.
		if (typeof(this.exifData[EXIFTAG_APERTUREVALUE]) != "undefined")
			this.fAperture = parseExifNum( EXIFTAG_APERTUREVALUE, /\D*([\d.]+)/, this.exifData);
		else
			this.fAperture = fixValue( parseExifNum(EXIFTAG_FNUMBER,			/\D*([\d.]+)/, this.exifData), srcfStop, dstfStop );
		
		// This conversion (from F-Number to Aperture) is only needed because Photoshop
		// insists on doing the inverse (a to f) conversion before it reports the "aperture"
		if (this.fAperture != 0.0)
			this.fAperture = Math.log(this.fAperture) / Math.log(Math.sqrt(2));
	}
	
	// Stash the text now, so we have it when the document
	// is closed in PS and fPSDoc is no longer available
	this.fString = this.toString();
}

// Add this stackElement as a layer in document "stack"
StackElement.prototype.stackLayer = function ( stack )
{
	function suspendedAction()
	{
		if (app.activeDocument.layers.length > 1)
			app.activeDocument.flatten();
		
		app.activeDocument.activeLayer.duplicate( stack );
	}

	this.setupEXIFData();
	app.activeDocument = this.fPSDoc;
	// Keep any flattening out of this history list, so document stays as-is
	app.activeDocument.suspendHistory( "temp", "suspendedAction()" );
	undoLastEvent();
	
	app.activeDocument = stack;
	/* NOTE:  For Lens correction we could export make and model here - but for the moment we will not do this! */
	if (this.fFocalLength > 0.0)
	{
		var tmpName;
		tmpName = this.fName;
		if (tmpName.length > 13) tmpName = "Layer"+(app.activeDocument.layers.length-1);
		tmpName += " ( fLen: " +
				this.fFocalLength + " ccd: " + this.fCCD +
				" id:\"" + this.fMake.substring(0,7) + "\" ";
		var maxChars;
		// there is a 64 character limit on the layer name when passing to the filter
		maxChars = 58 - tmpName.length;
		tmpName += "\"" + this.fModel.substring(Math.max(0,this.fModel.length-maxChars), this.fModel.length ) + "\"" + " )";
		app.activeDocument.activeLayer.name = tmpName;
	}
	else 
	{
		app.activeDocument.activeLayer.name = this.fName;
	}
 	
	this.closeDocIfNotAlreadyOpen();
}

// Return a string representation of this StackElement
StackElement.prototype.toString = function()
{
	var i, result = '';
	if (Object.isValid(this.fPSDoc))
	{
		var docValues = { 'fAspectRatio':this.fPSDoc.pixelAspectRatio.toString().match(/[\d.]+/),
				 	 	  'fDepth':(this.fPSDoc.bitsPerChannel == BitsPerChannelType.SIXTEEN) ? 16 : 8 };
		for (i in docValues)
			result += i + '=' + docValues[i] + '\t';
	}
	var exifValues = [ 'fWidth', 'fHeight', 'fExposure', 'fAperture', 'fISOValue', 'fCameraID' ];
	for (i in exifValues)
		result += exifValues[i] + '=' + this[exifValues[i]] + '\t';
	result += 'fName' + '=' + encodeURI(this.fName) + '\t';
	result += 'fFullName=' + encodeURI(File(this.fFullName).fsName) + '\t';
	return result + '\n';
}

//
// Extend StackElements to know about quad corners
//
// WARNING:  Geometry.jsx must be loaded to use these methods!
//

StackElement.prototype.getBounds = function()
{
	var i;
	if (typeof(this.fCorners) == "undefined")
		return new TRect( 0, 0, this.fWidth, this.fHeight );
	
	return new TRect( this.fCorners );
}

StackElement.prototype.setCornersToSize = function()
{
	this.fCorners = [new TPoint(0,0), new TPoint(this.fWidth, 0),
						new TPoint(this.fWidth, this.fHeight), new TPoint( 0, this.fHeight) ];
}

StackElement.prototype.offset = function( delta )
{
	var i;
	for (i = 0; i < this.fCorners.length; i++)
		this.fCorners[i] = this.fCorners[i] + delta;
}

StackElement.prototype.scale = function( s )
{
	var i;
	for (i = 0; i < this.fCorners.length; ++i)
		this.fCorners[i] *= s;
}

StackElement.prototype.transform = function()
{
	// Need to make active layer first... (obvious line broken if mulitple layers selected)
//	app.activeDocument.activeLayer = app.activeDocument.layers[this.fName];
	selectOneLayer( app.activeDocument, this.fName );
	transformActiveLayer( this.fCorners );
}

/************************************************************/
// ImageStackCreator routines
//
// The ImageStackCreator is a base class for a number of objects (e.g. Photomerge,
// Merge to HDR, Load Files into Stack, etc.) creating a document with layers
// read from individual files.

// Container object
function ImageStackCreator( stackName, newDocName, introText )
{
	this.pluginName		= stackName; 
	this.untitledName	= newDocName;
	this.hdrDocNum		= 0;
	this.introText = typeof(introText) == "string" ? introText : null;
	this.stackElements	= null;
	this.hideAlignment	= true;
	this.gaveWarning = {"32bit": false, "multichannel": false, "rawmod": false, "smartobj": false, "3D":false };
	// Hook for dialog setup before the dialog is shown
	this.customDialogSetup = function( dialog ) {};
	// Hook for collecting arguments after "OK" is clicked
	this.customDialogFunction = function( dialog ) {};
	// Hook for passing additional parameters into the plugin
	this.customPluginArguments = function( desc ) {};
	this.stackDoc = null;
	this.useAlignment	 = false;
	this.runningFromBridge = false;
	this.linearizeCamRawFiles = false;
	this.stackDepthChanged = false;
	this.exposureMetadataValid = true;

	// These flags control what the stack creator will and won't accept.
	// Defaults are for Merge to HDR
	this.mustBeSameSize			= true;	// Images' height & width must match
	this.mustBeUnmodifiedRaw	= true;	// Exposure adjustements in Camera raw are not allowed
	this.mustNotBe32Bit			= true;	// No 32 bit images
	this.mustNotBeSmartObj		= true;	// No smart objects
	this.mustNotBe3D				= true;	// No 3D
}


// Since hdrDocNum is not saved session to session, look at the open documents
// and pick something that's higher than any other untitledName docs open.
ImageStackCreator.prototype.newDocName = function ()
{
	var i;

	for (i = 0; i < app.documents.length; ++i)
	{
		var m = app.documents[i].name.match(eval( "/" + this.untitledName + "([0-9]+)/" ));
		if (m && m[1] > this.hdrDocNum)
			this.hdrDocNum = m[1];
	}
	return this.untitledName + String(++this.hdrDocNum);
}

// Display alerts encountered while stacking files.
// Note all warning text is prefixed with the pluginName
ImageStackCreator.prototype.giveWarning = function( flag, warning, errorIcon )
{
	if (typeof(errorIcon) == "undefined")
		errorIcon = true;
	if (! this.gaveWarning[flag])
	{
		alert( this.pluginName + localize(warning), this.pluginName, errorIcon );
		this.gaveWarning[flag] = true;
	}
}

// Check the mode of the document to make sure it's compatible with the subclass
ImageStackCreator.prototype.checkMode = function( doc )
{
	// Check for any changes introduced by Camera raw.  Must
	// check here while we still have access to the document
	function hasCamRawChanges(doc)
	{
		function hasCRsetting(doc, tag)
		{
			var xmpStr = doc.xmpMetadata.rawData;
			var tagRE = eval( "/<crs:" + tag + ">([-+\\d.]+)</m" );
			var result = xmpStr.match(tagRE);
			if (result)
				return result[1] != 0;
			else
				return false;	// No flag, assume OK (i.e., JPEG file)
		}
	
		// Check for the crs:AlreadyApplied flag.  If it's false, then
		// the pixels are still unmolested by ACR and the settings are
		// ignored when the file is read.
		var alreadyApplied = doc.xmpMetadata.rawData.match(/<crs:AlreadyApplied>\s*([tTrufFalse]+)</m);
		if (alreadyApplied && !eval(alreadyApplied[1].toLowerCase()))
			return false;	// Flag is "false", so ACR settings will be ignored.
		
		// These tags are always in English
		var crsFlags = ["Exposure", "Shadows", "Brightness", "Contrast", "FillLight", "HighlightRecovery"];
		var i;
		for (i in crsFlags)
			if (hasCRsetting( doc, crsFlags[i] ))
				return true;
		return false;
	}

	if (this.mustBeUnmodifiedRaw && hasCamRawChanges(doc))
	{
		this.giveWarning( "rawmod", "$$$/AdobePlugin/Shared/Exposuremerge/CamRawChange=: Files converted from Camera Raw format may lose dynamic range.  For best results, merge the original Camera Raw files.", false );
		this.exposureMetadataValid = false;
		return true;
	}

	if (this.mustNotBe32Bit && (doc.bitsPerChannel == BitsPerChannelType.THIRTYTWO))
	{
		this.giveWarning( "32bit", "$$$/AdobePlugin/Shared/Exposuremerge/Auto/EMNo32bit= can not merge 32 bit source files.  They will be skipped");
		return false;
	}
	
	if (this.mustNotBeSmartObj && (doc.activeLayer.kind == LayerKind.SMARTOBJECT))
	{
		this.giveWarning( "smartobj", "$$$/AdobePlugin/Shared/Exposuremerge/Auto/NoSmartObj= can not merge Smart Object documents.  They will be skipped");
		return false;
	}

	// This error message is bogus, but it's too late to provide a "real" one.
	if (this.mustNotBe3D && (doc.activeLayer.kind == LayerKind.LAYER3D))
	{
		this.giveWarning( "3D", "$$$/AdobePlugin/Shared/Exposuremerge/Auto/NoSmartObj= can not merge Smart Object documents.  They will be skipped");
		return false;
	}
	
	// Other conversions happen on layer copy, but these need explicit handling
	if (doc.mode == DocumentMode.MULTICHANNEL)
	{
		this.giveWarning("multichannel", "$$$/AdobePlugin/Shared/Exposuremerge/Auto/EMNoMultichannel= cannot process multichannel images. They will be converted to RGB.", false );
		doc.changeMode( ChangeMode.RGB );
		return true;
	}
	
	if (doc.mode == DocumentMode.INDEXEDCOLOR)
	{
		doc.changeMode( ChangeMode.RGB );
		return true;
	}
	
	if (doc.mode == DocumentMode.BITMAP)
	{
		doc.changeMode( ChangeMode.GRAYSCALE );
		return true;
	}
	
	return true;
}

// Align the images in the stack.  Override this if you need to customize it.
ImageStackCreator.prototype.alignStack = function( stackDoc )
{
	// Tell it to extend the select to the next to the last
	// (last layer is the merge result, we don't want that selected)
	selectAllLayers(stackDoc, 2);
	alignLayersByContent();
}

// Load the stack elements in this.stackElements into a layered document
ImageStackCreator.prototype.loadStackLayers = function( stackBitsPerChannel )
{
	var bridgeFilesAlertGiven = false;
	var i;

	// Close everything before we bail out
	function shutdown(stackElemList)
	{
		var j;
		if (stackDoc)
			stackDoc.close(SaveOptions.DONOTSAVECHANGES);
		for (j = 0; j < stackElemList.length; ++j)
			stackElemList[j].closeDocIfNotAlreadyOpen();
		if (typeof(saveUnits) != 'undefined')
			app.preferences.rulerUnits = saveUnits;
	}
	
	function nullFileAlert(usingBridge, filename, pluginName)
	{
		if (usingBridge)
		{
			if (! bridgeFilesAlertGiven)
			{
				alert(localize("$$$/AdobePlugin/Shared/Exposuremerge/Auto/BRFileSkip=Some files selected in Bridge are not compatible and will be skipped"), pluginName );
				bridgeFilesAlertGiven = true;
			}
		}
		else
			alert(localize("$$$/AdobePlugin/Shared/ExposureMerge/Auto/CantOpen=Unable to open file: ") + filename, pluginName );
	}
	
	try {
		var stackDoc = null;
		this.stackDoc = null;

		// Reverse so layers match load order; (layers go from bottom to top)
		this.stackElements.reverse(); 

		var firstDoc = this.stackElements[0].silentOpen( this.linearizeCamRawFiles );
		
		// Ensure the first document is valid
		while ((firstDoc == null) || (! this.checkMode( firstDoc )))
		{
			if (firstDoc == null)
				nullFileAlert( this.runningFromBridge, this.stackElements[0].fName, this.pluginName );
			this.stackElements[0].closeDocIfNotAlreadyOpen();
			this.stackElements = this.stackElements.slice(1);
			if (this.stackElements.length > 1)
				firstDoc = this.stackElements[0].silentOpen( this.linearizeCamRawFiles );
			else
				break;
		}	

		if (this.stackElements.length < 2)
		{
			shutdown(this.stackElements);
			return null;
		}

		// Work in pixels
		var saveUnits = app.preferences.rulerUnits;
		app.preferences.rulerUnits = Units.PIXELS;

		// Create the destination stack doc to resemble the first one.
		// If we "add" the document, we can't copy any custom color profiles;
		// so instead we duplicate it, and then throw away the contents.
		app.activeDocument = firstDoc;
		duplicateDocument( this.newDocName() );
		stackDoc = app.activeDocument;
		stackDoc.flatten();
		stackDoc.activeLayer.isBackgroundLayer = false;
		stackDoc.activeLayer.clear();
		stackDoc.selection.deselect();		// DOM bug - shouldn't need to do this.
										  
		// The old ADM Photomerge filter plugin needs eight bit data,Lo
		// so if that's requested we force the stack to eight bits
		// and flag this.
		this.stackDepthChanged = false;
		if (typeof( stackBitsPerChannel ) == "undefined")
			stackBitsPerChannel = firstDoc.bitsPerChannel;
		else
			this.stackDepthChanged = firstDoc.bitsPerChannel != stackBitsPerChannel;

		stackDoc.bitsPerChannel = stackBitsPerChannel;
		stackDoc.layers[0].name = this.pluginName;

		this.stackElements[0].stackLayer( stackDoc );
		// firstDoc is closed and unavailable after this point

		for (i = 1; i < this.stackElements.length; ++i)
		{
			doc = this.stackElements[i].silentOpen( this.linearizeCamRawFiles );
			if (doc == null)		// Open failed
			{
				nullFileAlert( this.runningFromBridge, this.stackElements[i].fName, this.pluginName );
							
				this.stackElements.splice(i,1);
				i -= 1;
				if (this.stackElements.length < 2)
				{
					shutdown(this.stackElements);
					return null;
				}
				continue;
			}
		
			// If the sizes change, bail
			if (this.mustBeSameSize)
			{
				if ((Number(doc.height) != Number(stackDoc.height)) || (Number(doc.width) != Number(stackDoc.width)))
				{
					alert(localize("$$$/AdobePlugin/Shared/ExposureMerge/Auto/SameSize=Images to be merged must be the same size"), this.pluginName, true );
					shutdown(this.stackElements);
					return null;
				}
			}

			// Toss out any files we can't use.
			if (! this.checkMode( doc ))
			{
				this.stackElements[i].closeDocIfNotAlreadyOpen();
				this.stackElements.splice(i,1);
				i -= 1;
				if (this.stackElements.length < 2)
				{
					shutdown(this.stackElements);
					return null;
				}
				continue;
			}
			
			// If the depth doesn't match the dest stack, fix the dest stack
			if ( (!this.stackDepthChanged) &&
				(doc.bitsPerChannel == BitsPerChannelType.SIXTEEN)
				&& (stackDoc.bitsPerChannel == BitsPerChannelType.EIGHT))
			{
				app.activeDocument = stackDoc;
				stackDoc.bitsPerChannel = BitsPerChannelType.SIXTEEN;
			}
			
			// Extend the size of the stackDoc to hold the largest layer encountered
			// (need to do this as we go, because we haven't actually opened the docs until now)
			if ((this.stackElements[i].fWidth > stackDoc.width.as("px"))
				|| (this.stackElements[i].fHeight > stackDoc.height.as("px")))
			{
				var maxw = UnitValue( Math.max( this.stackElements[i].fWidth, stackDoc.width.as("px") ), "px" );
				var maxh = UnitValue( Math.max( this.stackElements[i].fHeight,stackDoc.height.as("px") ), "px" );

				app.activeDocument = stackDoc;
				app.activeDocument.resizeCanvas( maxw, maxh, AnchorPosition.TOPLEFT );
			}

			this.stackElements[i].stackLayer( stackDoc );
		}

		if (this.useAlignment)
		{
			this.alignStack( stackDoc );
			stackDoc.activeLayer = stackDoc.layers.getByName(this.pluginName);
		}
	
	}
	catch (err)
	{
		if (err.number == kErrTempDiskFull) {
			this.stackElements[0].scratchDiskFullAlert();
			shutdown(this.stackElements);
		} 
		else if (err.number == kUserCanceledError)
			shutdown(this.stackElements);
		return null;
	}
	app.preferences.rulerUnits = saveUnits;
	this.stackDoc = stackDoc;
	return stackDoc;
}

// Set up and call a filter plugin
ImageStackCreator.prototype.invokeFilterPlugin = function( filterPluginID, showDialog )
{
	var args = new ActionDescriptor();
	var i, j, pieceData = '';
	
	// Collect the per-element metadata
	for (i in this.stackElements)
		pieceData += this.stackElements[i].fString;
		
	args.putString( app.charIDToTypeID('EmPs'), pieceData );

	// Custom hook, defined in subclass, for passing additional parameters.
	this.customPluginArguments( args );
	
	try {
		var result = executeAction( app.stringIDToTypeID( filterPluginID ), args, 
									    showDialog ? DialogModes.ALL : DialogModes.NO );
		return result;
	}
	catch (err)
	{
		if (err.number != kUserCanceledError)		// psUserCanceled, as found in CPsError.h, found in the ScriptingSupport plugin sources
			alert(err, this.pluginName, true );

		return null;
	}
	return -1;	// Should never get here
}

// Implement the dialog to collect the files to process.
ImageStackCreator.prototype.stackDialog = function( dialogFilename )
{
	var w = latteUI( g_StackScriptFolderPath + dialogFilename );
	var mergeFiles = new Array();
	var fileSelectStr;
	var fileMenuItem = 		localize("$$$/Project/Exposuremerge/Files/Files=Files");
	var folderMenuItem = 	localize("$$$/Project/Exposuremerge/Files/Folder=Folder");
	var openFilesMenuItem = localize("$$$/Project/Exposuremerge/Files/Open=Open Files");
	
	function enableControls()
	{
		w.findControl('_align').enabled = (mergeFiles.length > 1);
		w.findControl('_remove').enabled = (mergeFiles.length > 0) && w.findControl('_fileList').selection;
		w.findControl('_ok').enabled = (mergeFiles.length > 1);
	}
	
	function addFileToList(f)
	{
		var i;
		if (f == null)
			return;
			
		for (i in mergeFiles)
			if (f.toString() == mergeFiles[i].file.toString())	// Already in list?
				return;
				
		// Windows - use filter to skip evil sidecar files
		if ((File.fs == "Windows") && !winFileSelection( f ))
			return;

		var fileList = w.findControl('_fileList');
		fileList.add('item', File.decode(f.name) );
		mergeFiles.push(new StackElement(f));
	}
		
	// Dialog event handling routines
	
	function removeOnClick()
	{
		var i, s;
		var selList = w.findControl('_fileList').selection;
		for (s in selList)
		{
			for (i in mergeFiles)
				if (File.decode(mergeFiles[i].file.name) == selList[s].text)
				{
					mergeFiles.splice(i,1);
					break;
				}
			w.findControl('_fileList').remove(selList[s]);
		}
		enableControls();
	}
	
	function browseOnClick()
	{
		// Spring back to the "File..." menu item
		var menu = w.findControl('_source');
//		menu.items[0].selected = true;
		switch (menu.selection.text)
		{
			case fileMenuItem:
			{
				var i, filenames = photoshopFileOpenDialog();
				if (filenames.length)
				{
					if (File.fs == "Macintosh")	// Mac gratiuitously scrambles them...why?
						filenames.sort();
					for (i in filenames)
						addFileToList( File(filenames[i]) );
				}
				break;
			}
			case folderMenuItem:
			{
				var folder = Folder.selectDialog(localize('$$$/AdobePlugin/Exposuremerge/FolderSelect=Select folder'));
				if (folder)
				{
					fileList = folder.getFiles( $.os.match(/^Macintosh.*/) ? macFileSelection : winFileSelection );
					var f;
					for (f in fileList)
						addFileToList(fileList[f]);
				}
				break;
			}
		}
		enableControls();
		return;
	}
	
	function addOpenDocuments()
	{
		var gaveUnsavedWarning = false;

		// doc.saved is true when a new empty document is created.
		function isReallySaved( doc )
		{
			if (! doc.saved)
				return false;
			try
			{
				var n = doc.fullName;
			}
			catch (err)	// Mainly for err.number == 8103, error.message == "The document has not yet been saved"
			{				// But if anything else goes wrong, we still don't want it.
				return false;
			}
			return true;
		}
		
		var i, haveUnsavedDocuments = false;
		for (i = 0; i < app.documents.length; i++)
			if (isReallySaved(app.documents[i]))
				addFileToList( File( app.documents[i].fullName ) );
			else
				haveUnsavedDocuments = true;
				
		if (haveUnsavedDocuments && !gaveUnsavedWarning)
		{
			alert(localize('$$$/AdobePlugin/Exposuremerge/Mustsave=Documents must be saved before they can be merged'));
			gaveUnsavedWarning = true;
			w.findControl('_source').items[0].selected = true;
		}
		enableControls();
	}
	
	function sourceMenuOnChange()
	{
		var menu = w.findControl('_source');
		switch (menu.selection.text) 
		{
			case fileMenuItem:		break;		// default
			case folderMenuItem:		break;
			case openFilesMenuItem:
				addOpenDocuments();
				break;
		}
	}

	function listOnChange()
	{
		enableControls();
	}
	
	w.center();
	w.text = this.pluginName;
	if (this.introText)
		w.findControl('_intro').text = this.introText;
	// Set up source menu
	var menu = w.findControl('_source');
	menu.add( 'item', fileMenuItem );
	menu.add( 'item', folderMenuItem );
	
	// The "addOpenDocs" button was added at the last moment.  If it's
	// there, then use that in favor of the menu.
	var addOpenDocsButton = w.findControl('_addOpenDocs');
	// Really, you want to disable the menu, but that's not possible w/ScriptUI
	if (app.documents.length > 0 && !addOpenDocsButton)
		menu.add( 'item', openFilesMenuItem ); 
	menu.items[0].selected = true;
	menu.preferredSize.width = 214;	// Brute force fix for PR1355780
	
	this.customDialogSetup( w );
	
	var fileSelection;
	
	w.findControl('_browse').onClick = browseOnClick;
	w.findControl('_fileList').onChange = listOnChange;
	w.findControl('_remove').onClick = removeOnClick;
	w.findControl('_source').onChange = sourceMenuOnChange;
	if (this.hideAlignment)
		w.findControl('_align').visible = false;
	w.findControl('_align').value = this.useAlignment;
	
	if (addOpenDocsButton)
	{
		addOpenDocsButton.onClick = addOpenDocuments;
		addOpenDocsButton.enabled = app.documents.length > 0;
	}
	else		
		addOpenDocuments();
		
	// If we already have stackElements (e.g., from Bridge) add them
	if (this.stackElements)
	{
		for (i in this.stackElements)
			addFileToList( this.stackElements[i].file );
	}
	
	enableControls();

	var result = w.show();
	if (result != kCanceled)
	{
		if (! this.hideAlignment)
			this.useAlignment = w.findControl('_align').value;
		this.customDialogFunction( w );
		if (result == kFilesFromPMLoad)
			return this.stackElements;		// Already loaded by photomerge.loadCompositionClick()
		else
			return mergeFiles
	}
	else
	{
		// Strange fix for PS problem where a cancel out of file selection & this dialog would
		// leave most of the Photoshop menus disabled.
		if (File.fs == "Macintosh")
			app.bringToFront();
		return null;
	}
}

// Bridge voodoo taken from Ruark's code
ImageStackCreator.prototype.checkForBridgeFiles = function() 
{
	try {
		this.filesFromBridge = gFilesFromBridge;
		this.runningFromBridge = (this.filesFromBridge.length > 0);
		app.displayDialogs = DialogModes.NO;
		return this.runningFromBridge;
	}
	catch( e ) { 
		this.runningFromBridge = false;
		this.filesFromBridge = undefined;
	}
	return false;
}

ImageStackCreator.prototype.getFilesFromBridgeOrDialog = function( dialogFile, preloadDialogFromBridge )
{
	this.stackElements = null;
	if (typeof(preloadDialogFromBridge) == "undefined")
		preloadDialogFromBridge = false;
	if (this.checkForBridgeFiles())
	{
		this.stackElements = new Array();
		var j;
		for (j in this.filesFromBridge)
			if ( isValidImageFile( this.filesFromBridge[j] ) )
				this.stackElements.push( new StackElement( this.filesFromBridge[j] ));

		if (this.stackElements.length < 2)
		{
			alert(this.pluginName + localize("$$$/AdobePlugin/Shared/Exposuremerge/Auto/NeedAtLeast2= needs at least two files selected."), this.pluginName, true );
			this.stackElements = null;
			return;
		}
		
	}
	
	if ((this.stackElements == null) || preloadDialogFromBridge)
		this.stackElements = this.stackDialog( dialogFile );
}

/************************************************************/
// loadLayers routines

loadLayers = new ImageStackCreator( localize("$$$/AdobePlugin/Shared/LoadStack/Process/Name=Load Layers"),
										  localize('$$$/AdobePlugin/Shared/LoadStack/Auto/untitled=Untitled' ) );

// LoadLayers is less restrictive than MergeToHDR
loadLayers.mustBeSameSize			= false;	// Images' height & width don't need to match
loadLayers.mustBeUnmodifiedRaw		= false;	// Exposure adjustements in Camera raw are allowed
loadLayers.mustNotBe32Bit			= false;	// 32 bit images
loadLayers.createSmartObject		= false;	// If true, option to create smart object is checked.

// Add hooks to read the value of the "Create Smart Object" checkbox
loadLayers.customDialogSetup = function( w )
{
	w.findControl('_createSO').value = loadLayers.createSmartObject;
	/* don't show createSO or align checkboxes....
	if (! app.featureEnabled( localize( "$$$/private/ExtendedImageStackCreation=ImageStack Creation" ) ))*/

	w.findControl('_createSO').hide();
	w.findControl('_align').hide();
}

loadLayers.customDialogFunction = function( w )
{
	loadLayers.createSmartObject = w.findControl('_createSO').value;
}

// Override the default to use "Auto" alignment.
loadLayers.alignStack = function( stackDoc )
{
	selectAllLayers(stackDoc, 2);
	alignLayersByContent( "Auto" );
}

loadLayers.stackLayers = function()
{
	var result, i, stackDoc = null;
	
	stackDoc = this.loadStackLayers();
	if (! stackDoc)
		return;
	
	// Nuke the "destination" layer that got created (M2HDR holdover)
	stackDoc.layers[this.pluginName].remove();
	
	// Stack 'em up.
	if (this.createSmartObject)
	{
		selectAllLayers( stackDoc );
		executeAction( knewPlacedLayerStr, new ActionDescriptor(), DialogModes.NO );
	}
}

// "Main" execution of Merge to HDR
loadLayers.doInteractiveLoad = function ()
{
	this.getFilesFromBridgeOrDialog( localize("$$$/Private/LoadStack/LoadLayersexv=LoadLayers.exv") );

	if (this.stackElements)
		this.stackLayers();
}

loadLayers.intoStack = function(filelist, alignFlag)
{
	if (typeof(alignFlag) == 'boolean')
		loadLayers.useAlignment = alignFlag;
		
	if (filelist.length < 2)
	{
		alert(localize("$$$/AdobeScripts/Shared/LoadLayers/AtLeast2=At least two files must be selected to create a stack."), this.pluginName, true );
		return;
	}
	var j;
	this.stackElements = new Array();
	for (j in filelist)
	{
		var f = filelist[j];
		this.stackElements.push( new StackElement( (typeof(f) == 'string') ? File(f) : f ) );
	}
		
	if (this.stackElements.length > 1)
		this.mergeStackElements();
}

if (typeof(loadLayersFromScript) == 'undefined')
	loadLayers.doInteractiveLoad();
