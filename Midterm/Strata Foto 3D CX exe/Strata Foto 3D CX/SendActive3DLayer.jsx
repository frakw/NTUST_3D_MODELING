// enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

// in case we double clicked the file
app.bringToFront();


// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
// $.level = 0;
// debugger; // launch debugger on next line


var kResultLayerName = "Strata Foto 3D[in] Result";
var kNewDocumentItem = "New";
var kNewDocumentNamePrefix = "Untitled-";
var kHistoryEntry = "Strata Foto 3D Result";
	// I'm sure these strings should come from a localized resource.

var kOpenDocForDefaults = true;
	// I'm not so sure this helps anyway.  But at least we can avoid the flash of a larger document followed by a smaller default.

var returnResult = 'OK';
	// global for our result, send a 'cancel' back to Photoshop to not get a history entry and to not get a recorded action.

var choice = -1;



main( true, choice, %%_DELETE_OLD_LAYER_%%, %%_HIDE_OLD_LAYER_%% );
		// Pass true to get a single history entry.

returnResult;


function main (singleHistoryEntry, docIndex, deleteOld, hideOld)
{
	var doc;
	var filePath = "%%_FILE_PATH_%%";
	
	if (docIndex >= app.documents.length)
	{
		var fileRef = new File( filePath );
		var templateDoc;

		if (kOpenDocForDefaults)
		{
			templateDoc = app.open( fileRef );
		}

		if ( false )
		{
			// If opening a 3D layer into a new document why not just open the file and leave?
			// Because then we'll keep referencing a temporary file.  That's not so good.
			// Plus we can't easily apply the selected name.
			return;
		}

		if (kOpenDocForDefaults)
		{
			doc = app.documents.add( templateDoc.width, templateDoc.height, templateDoc.resolution, docName,
										NewDocumentModeFromDocumentMode( templateDoc.mode ), DocumentFill.TRANSPARENT,
										templateDoc.pixelAspectRatio, templateDoc.bitsPerChannel );

			templateDoc.close( SaveOptions.DONOTSAVECHANGES );
		}
		else
		{
			doc = app.documents.add();
				// Take all the usual defaults.
		}
		app.activeDocument = doc

		deleteOld = true;
			// Make sure we get rid of the default layer.
	}
	else if (docIndex >= 0)
	{
		doc = app.documents[ docIndex ];
		app.activeDocument = doc
	}
	else
	{
		doc = app.activeDocument;
	}

	if (singleHistoryEntry)
	{
		doc.suspendHistory( kHistoryEntry, "main(false, -1, " + deleteOld + ", " + hideOld + ")" )
	}
	else
	{
		DoItForDocument( doc, filePath, "%%_CLEANUP_FILTER_CLASS_ID_%%", "%%_CLEANUP_DATA_PATH_%%", "%%_CLEANUP_DATA_%%", deleteOld, hideOld )
	}
}


function DoItForDocument (doc, filePath, cleanupClassID, cleanupDataPath, cleanupData, deleteOld, hideOld)
{
	var oldLayer = doc.activeLayer
	var fileRef = new File( filePath )

	if (!kOpenDocForDefaults)
		// This isn't necessary if we're already opening the document to get default parameters.
	{
//		PurgeTextureCaches( filePath )
		PurgeTextureCaches( "%%_PURGE_FILE_PATH_%%" )
		
			// Deal with the texture caching bug in Photoshop
	}

	Add3DLayerFromFile( fileRef )
	doc.activeLayer.name = kResultLayerName

	if (hideOld)
	{
		oldLayer.visible = false
	}
	if (deleteOld)
	{
		oldLayer.remove()
	}

	if (cleanupClassID != "" && cleanupDataPath != "" && cleanupData != "")
	{
		// Run the requested filter...
		var dataFile = new File( cleanupDataPath );
		var catchCount = 0;

		try
		{
			var filterAction = charIDToTypeID( cleanupClassID );

			dataFile.open( "w" );
			dataFile.write( cleanupData );
			dataFile.close();

			executeAction( filterAction, undefined, DialogModes.NO );
		}
		catch (exception)
		{
//			alert(exception);
				// Say something or ignore it?
			catchCount = catchCount + 1;
		}
		finally
		{
			// So are we good now?
			dataFile.remove()
				// This shouldn't throw an exception.  It'll return false if it fails.
		}
	}
	else
	{
		// Foto 3D set the global ambient light
		/*var idsetthreeDGlobalAmbient = stringIDToTypeID( "set3DGlobalAmbient" );
    		var desc4 = new ActionDescriptor();
   		var idGamR = charIDToTypeID( "GamR" );
    		desc4.putDouble( idGamR, 1.0);
    		var idGamG = charIDToTypeID( "GamG" );
    		desc4.putDouble( idGamG, 0.2 );
    		var idGamB = charIDToTypeID( "GamB" );
    		desc4.putDouble( idGamB, 0.2 );
		executeAction( idsetthreeDGlobalAmbient, desc4, DialogModes.NO );
		*/
		if (%%_PAINT_READY_%%) {
			try {
				MakePaintReady();
			}
			catch (err) { }
		}
		

		// Foto 3D model clean up
		fileRef.remove();
		var texFile = new File("%%_PURGE_FILE_PATH_%%");
		texFile.remove();

		

	}
}

function SetBackground(grayval)
{
// =======================================================
var idsetd = charIDToTypeID( "setd" );
    var desc4 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
        var ref1 = new ActionReference();
        var idClr = charIDToTypeID( "Clr " );
        var idBckC = charIDToTypeID( "BckC" );
        ref1.putProperty( idClr, idBckC );
    desc4.putReference( idnull, ref1 );
    var idT = charIDToTypeID( "T   " );
        var desc5 = new ActionDescriptor();
        var idRd = charIDToTypeID( "Rd  " );
        desc5.putDouble( idRd, grayval);
        var idGrn = charIDToTypeID( "Grn " );
        desc5.putDouble( idGrn, grayval);
        var idBl = charIDToTypeID( "Bl  " );
        desc5.putDouble( idBl, grayval);
    var idRGBC = charIDToTypeID( "RGBC" );
    desc4.putObject( idT, idRGBC, desc5 );

executeAction( idsetd, desc4, DialogModes.NO );
}

function MakePaintReady()
{
/*
// =======================================================
var idsetd = charIDToTypeID( "setd" );
    var desc4 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
        var ref1 = new ActionReference();
        var idClr = charIDToTypeID( "Clr " );
        var idBckC = charIDToTypeID( "BckC" );
        ref1.putProperty( idClr, idBckC );
    desc4.putReference( idnull, ref1 );
    var idT = charIDToTypeID( "T   " );
        var desc5 = new ActionDescriptor();
        var idGry = charIDToTypeID( "Gry " );
        desc5.putDouble( idGry, 100.000000 );
    var idGrsc = charIDToTypeID( "Grsc" );
    desc4.putObject( idT, idGrsc, desc5 );
executeAction( idsetd, desc4, DialogModes.NO );
*/

SetBackground(0.0);

// =======================================================
var idsetthreeDMaterialTexturePath = stringIDToTypeID( "set3DMaterialTexturePath" );
    var desc6 = new ActionDescriptor();
    var idtypeID = stringIDToTypeID( "typeID" );
    desc6.putInteger( idtypeID, 1 );
    var idType = charIDToTypeID( "Type" );
    desc6.putInteger( idType, 6 );
    var idPath = charIDToTypeID( "Path" );
    desc6.putString( idPath, "Foto3Dmtl_Self-Illumination.psd" );
    var idNw = charIDToTypeID( "Nw  " );
        var desc7 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc7.putString( idNm, "Foto3Dmtl - Self-Illumination" );
        var idMd = charIDToTypeID( "Md  " );
        var idRGBM = charIDToTypeID( "RGBM" );
        desc7.putClass( idMd, idRGBM );
        var idWdth = charIDToTypeID( "Wdth" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc7.putUnitDouble( idWdth, idRlt, %%_WIDTH_%% );
        var idHght = charIDToTypeID( "Hght" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc7.putUnitDouble( idHght, idRlt, %%_HEIGHT_%% );
        var idRslt = charIDToTypeID( "Rslt" );
        var idRsl = charIDToTypeID( "#Rsl" );
        desc7.putUnitDouble( idRslt, idRsl, 72.000000 );
        var idpixelScaleFactor = stringIDToTypeID( "pixelScaleFactor" );
        desc7.putDouble( idpixelScaleFactor, 1.000000 );
        var idFl = charIDToTypeID( "Fl  " );
        var idFl = charIDToTypeID( "Fl  " );
        var idBckC = charIDToTypeID( "BckC" );
        desc7.putEnumerated( idFl, idFl, idBckC );
        var idDpth = charIDToTypeID( "Dpth" );
        desc7.putInteger( idDpth, 8 );
        var idprofile = stringIDToTypeID( "profile" );
        desc7.putString( idprofile, "sRGB IEC61966-2.1" );
    var idDcmn = charIDToTypeID( "Dcmn" );
    desc6.putObject( idNw, idDcmn, desc7 );
    var idkeythreeDName = stringIDToTypeID( "key3DName" );
    desc6.putString( idkeythreeDName, "Foto3Dmtl" );
executeAction( idsetthreeDMaterialTexturePath, desc6, DialogModes.NO );

SetBackground(0.0);

// =======================================================
var idsetthreeDMaterialTexturePath = stringIDToTypeID( "set3DMaterialTexturePath" );
    var desc8 = new ActionDescriptor();
    var idtypeID = stringIDToTypeID( "typeID" );
    desc8.putInteger( idtypeID, 1 );
    var idType = charIDToTypeID( "Type" );
    desc8.putInteger( idType, 2 );
    var idPath = charIDToTypeID( "Path" );
    desc8.putString( idPath, "Foto3Dmtl_Bump.psd" );
    var idNw = charIDToTypeID( "Nw  " );
        var desc9 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc9.putString( idNm, "Foto3Dmtl - Bump" );
        var idMd = charIDToTypeID( "Md  " );
        var idRGBM = charIDToTypeID( "RGBM" );
        desc9.putClass( idMd, idRGBM );
        var idWdth = charIDToTypeID( "Wdth" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc9.putUnitDouble( idWdth, idRlt, %%_WIDTH_%% );
        var idHght = charIDToTypeID( "Hght" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc9.putUnitDouble( idHght, idRlt, %%_HEIGHT_%% );
        var idRslt = charIDToTypeID( "Rslt" );
        var idRsl = charIDToTypeID( "#Rsl" );
        desc9.putUnitDouble( idRslt, idRsl, 72.000000 );
        var idpixelScaleFactor = stringIDToTypeID( "pixelScaleFactor" );
        desc9.putDouble( idpixelScaleFactor, 1.000000 );
        var idFl = charIDToTypeID( "Fl  " );
        var idFl = charIDToTypeID( "Fl  " );
        var idBckC = charIDToTypeID( "BckC" );
        desc9.putEnumerated( idFl, idFl, idBckC );
        var idDpth = charIDToTypeID( "Dpth" );
        desc9.putInteger( idDpth, 8 );
        var idprofile = stringIDToTypeID( "profile" );
        desc9.putString( idprofile, "sRGB IEC61966-2.1" );
    var idDcmn = charIDToTypeID( "Dcmn" );
    desc8.putObject( idNw, idDcmn, desc9 );
    var idkeythreeDName = stringIDToTypeID( "key3DName" );
    desc8.putString( idkeythreeDName, "Foto3Dmtl" );
executeAction( idsetthreeDMaterialTexturePath, desc8, DialogModes.NO );

SetBackground(0.0);
// =======================================================
var idsetthreeDMaterialTexturePath = stringIDToTypeID( "set3DMaterialTexturePath" );
    var desc10 = new ActionDescriptor();
    var idtypeID = stringIDToTypeID( "typeID" );
    desc10.putInteger( idtypeID, 1 );
    var idType = charIDToTypeID( "Type" );
    desc10.putInteger( idType, 3 );
    var idPath = charIDToTypeID( "Path" );
    desc10.putString( idPath, "Foto3Dmtl_Glossiness.psd" );
    var idNw = charIDToTypeID( "Nw  " );
        var desc11 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc11.putString( idNm, "Foto3Dmtl - Glossiness" );
        var idMd = charIDToTypeID( "Md  " );
        var idRGBM = charIDToTypeID( "RGBM" );
        desc11.putClass( idMd, idRGBM );
        var idWdth = charIDToTypeID( "Wdth" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc11.putUnitDouble( idWdth, idRlt, %%_WIDTH_%% );
        var idHght = charIDToTypeID( "Hght" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc11.putUnitDouble( idHght, idRlt, %%_HEIGHT_%% );
        var idRslt = charIDToTypeID( "Rslt" );
        var idRsl = charIDToTypeID( "#Rsl" );
        desc11.putUnitDouble( idRslt, idRsl, 72.000000 );
        var idpixelScaleFactor = stringIDToTypeID( "pixelScaleFactor" );
        desc11.putDouble( idpixelScaleFactor, 1.000000 );
        var idFl = charIDToTypeID( "Fl  " );
        var idFl = charIDToTypeID( "Fl  " );
        var idBckC = charIDToTypeID( "BckC" );
        desc11.putEnumerated( idFl, idFl, idBckC );
        var idDpth = charIDToTypeID( "Dpth" );
        desc11.putInteger( idDpth, 8 );
        var idprofile = stringIDToTypeID( "profile" );
        desc11.putString( idprofile, "sRGB IEC61966-2.1" );
    var idDcmn = charIDToTypeID( "Dcmn" );
    desc10.putObject( idNw, idDcmn, desc11 );
    var idkeythreeDName = stringIDToTypeID( "key3DName" );
    desc10.putString( idkeythreeDName, "Foto3Dmtl" );
executeAction( idsetthreeDMaterialTexturePath, desc10, DialogModes.NO );

// =======================================================
/* //DON'T SET SHININESS as it wouldn't work with Strata Design[in]
var idsetthreeDMaterialTexturePath = stringIDToTypeID( "set3DMaterialTexturePath" );
    var desc12 = new ActionDescriptor();
    var idtypeID = stringIDToTypeID( "typeID" );
    desc12.putInteger( idtypeID, 1 );
    var idType = charIDToTypeID( "Type" );
    desc12.putInteger( idType, 5 );
    var idPath = charIDToTypeID( "Path" );
    desc12.putString( idPath, "Foto3Dmtl_Shininess.psd" );
    var idNw = charIDToTypeID( "Nw  " );
        var desc13 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc13.putString( idNm, "Foto3Dmtl- Shininess" );
        var idMd = charIDToTypeID( "Md  " );
        var idRGBM = charIDToTypeID( "RGBM" );
        desc13.putClass( idMd, idRGBM );
        var idWdth = charIDToTypeID( "Wdth" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc13.putUnitDouble( idWdth, idRlt, %%_WIDTH_%% );
        var idHght = charIDToTypeID( "Hght" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc13.putUnitDouble( idHght, idRlt, %%_HEIGHT_%% );
        var idRslt = charIDToTypeID( "Rslt" );
        var idRsl = charIDToTypeID( "#Rsl" );
        desc13.putUnitDouble( idRslt, idRsl, 72.000000 );
        var idpixelScaleFactor = stringIDToTypeID( "pixelScaleFactor" );
        desc13.putDouble( idpixelScaleFactor, 1.000000 );
        var idFl = charIDToTypeID( "Fl  " );
        var idFl = charIDToTypeID( "Fl  " );
        var idBckC = charIDToTypeID( "BckC" );
        desc13.putEnumerated( idFl, idFl, idBckC );
        var idDpth = charIDToTypeID( "Dpth" );
        desc13.putInteger( idDpth, 8 );
        var idprofile = stringIDToTypeID( "profile" );
        desc13.putString( idprofile, "sRGB IEC61966-2.1" );
    var idDcmn = charIDToTypeID( "Dcmn" );
    desc12.putObject( idNw, idDcmn, desc13 );
    var idkeythreeDName = stringIDToTypeID( "key3DName" );
    desc12.putString( idkeythreeDName, "Foto3Dmtl" );
executeAction( idsetthreeDMaterialTexturePath, desc12, DialogModes.NO );
*/

// =======================================================
var idsetthreeDMaterialTexturePath = stringIDToTypeID( "set3DMaterialTexturePath" );
    var desc14 = new ActionDescriptor();
    var idtypeID = stringIDToTypeID( "typeID" );
    desc14.putInteger( idtypeID, 1 );
    var idType = charIDToTypeID( "Type" );
    desc14.putInteger( idType, 4 );
    var idPath = charIDToTypeID( "Path" );
    desc14.putString( idPath, "Foto3Dmtl_Opacity.psd" );
    var idNw = charIDToTypeID( "Nw  " );
        var desc15 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc15.putString( idNm, "Foto3Dmtl - Opacity" );
        var idMd = charIDToTypeID( "Md  " );
        var idRGBM = charIDToTypeID( "RGBM" );
        desc15.putClass( idMd, idRGBM );
        var idWdth = charIDToTypeID( "Wdth" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc15.putUnitDouble( idWdth, idRlt, %%_WIDTH_%% );
        var idHght = charIDToTypeID( "Hght" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc15.putUnitDouble( idHght, idRlt, %%_HEIGHT_%% );
        var idRslt = charIDToTypeID( "Rslt" );
        var idRsl = charIDToTypeID( "#Rsl" );
        desc15.putUnitDouble( idRslt, idRsl, 72.000000 );
        var idpixelScaleFactor = stringIDToTypeID( "pixelScaleFactor" );
        desc15.putDouble( idpixelScaleFactor, 1.000000 );
        var idFl = charIDToTypeID( "Fl  " );
        var idFl = charIDToTypeID( "Fl  " );
        var idWht = charIDToTypeID( "Wht " );
        desc15.putEnumerated( idFl, idFl, idWht );
        var idDpth = charIDToTypeID( "Dpth" );
        desc15.putInteger( idDpth, 8 );
        var idprofile = stringIDToTypeID( "profile" );
        desc15.putString( idprofile, "sRGB IEC61966-2.1" );
    var idDcmn = charIDToTypeID( "Dcmn" );
    desc14.putObject( idNw, idDcmn, desc15 );
    var idkeythreeDName = stringIDToTypeID( "key3DName" );
    desc14.putString( idkeythreeDName, "Foto3Dmtl" );
executeAction( idsetthreeDMaterialTexturePath, desc14, DialogModes.NO );

// =======================================================
var idsetthreeDMaterialTexturePath = stringIDToTypeID( "set3DMaterialTexturePath" );
    var desc16 = new ActionDescriptor();
    var idtypeID = stringIDToTypeID( "typeID" );
    desc16.putInteger( idtypeID, 1 );
    var idType = charIDToTypeID( "Type" );
    desc16.putInteger( idType, 7 );
    var idPath = charIDToTypeID( "Path" );
    desc16.putString( idPath, "Foto3Dmtl_Reflectivity.psd" );
    var idNw = charIDToTypeID( "Nw  " );
        var desc17 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc17.putString( idNm, "Foto3Dmtl - Reflectivity" );
        var idMd = charIDToTypeID( "Md  " );
        var idRGBM = charIDToTypeID( "RGBM" );
        desc17.putClass( idMd, idRGBM );
        var idWdth = charIDToTypeID( "Wdth" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc17.putUnitDouble( idWdth, idRlt, %%_WIDTH_%% );
        var idHght = charIDToTypeID( "Hght" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc17.putUnitDouble( idHght, idRlt, %%_HEIGHT_%% );
        var idRslt = charIDToTypeID( "Rslt" );
        var idRsl = charIDToTypeID( "#Rsl" );
        desc17.putUnitDouble( idRslt, idRsl, 72.000000 );
        var idpixelScaleFactor = stringIDToTypeID( "pixelScaleFactor" );
        desc17.putDouble( idpixelScaleFactor, 1.000000 );
        var idFl = charIDToTypeID( "Fl  " );
        var idFl = charIDToTypeID( "Fl  " );
        var idBckC = charIDToTypeID( "BckC" );
        desc17.putEnumerated( idFl, idFl, idBckC );
        var idDpth = charIDToTypeID( "Dpth" );
        desc17.putInteger( idDpth, 8 );
        var idprofile = stringIDToTypeID( "profile" );
        desc17.putString( idprofile, "sRGB IEC61966-2.1" );
    var idDcmn = charIDToTypeID( "Dcmn" );
    desc16.putObject( idNw, idDcmn, desc17 );
    var idkeythreeDName = stringIDToTypeID( "key3DName" );
    desc16.putString( idkeythreeDName, "Foto3Dmtl" );
executeAction( idsetthreeDMaterialTexturePath, desc16, DialogModes.NO );

SetBackground(255.0);
// =======================================================
/*var idsetthreeDMaterialTexturePath = stringIDToTypeID( "set3DMaterialTexturePath" );
    var desc18 = new ActionDescriptor();
    var idtypeID = stringIDToTypeID( "typeID" );
    desc18.putInteger( idtypeID, 1 );
    var idType = charIDToTypeID( "Type" );
    desc18.putInteger( idType, 1 );
    var idPath = charIDToTypeID( "Path" );
    desc18.putString( idPath, "Foto3D_Environment.psd" );
    var idNw = charIDToTypeID( "Nw  " );
        var desc19 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc19.putString( idNm, "Foto3D Environment" );
        var idMd = charIDToTypeID( "Md  " );
        var idRGBM = charIDToTypeID( "RGBM" );
        desc19.putClass( idMd, idRGBM );
        var idWdth = charIDToTypeID( "Wdth" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc19.putUnitDouble( idWdth, idRlt, %%_WIDTH_%% );
        var idHght = charIDToTypeID( "Hght" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc19.putUnitDouble( idHght, idRlt, %%_HEIGHT_%% );
        var idRslt = charIDToTypeID( "Rslt" );
        var idRsl = charIDToTypeID( "#Rsl" );
        desc19.putUnitDouble( idRslt, idRsl, 72.000000 );
        var idpixelScaleFactor = stringIDToTypeID( "pixelScaleFactor" );
        desc19.putDouble( idpixelScaleFactor, 1.000000 );
        var idFl = charIDToTypeID( "Fl  " );
        var idFl = charIDToTypeID( "Fl  " );
        var idWht = charIDToTypeID( "Wht " );
        desc19.putEnumerated( idFl, idFl, idWht );
        var idDpth = charIDToTypeID( "Dpth" );
        desc19.putInteger( idDpth, 8 );
        var idprofile = stringIDToTypeID( "profile" );
        desc19.putString( idprofile, "sRGB IEC61966-2.1" );
    var idDcmn = charIDToTypeID( "Dcmn" );
    desc18.putObject( idNw, idDcmn, desc19 );
    var idkeythreeDName = stringIDToTypeID( "key3DName" );
    desc18.putString( idkeythreeDName, "Foto3Dmtl" );
executeAction( idsetthreeDMaterialTexturePath, desc18, DialogModes.NO );
*/

// =======================================================
var idsetthreeDMaterialTexturePath = stringIDToTypeID( "set3DMaterialTexturePath" );
    var desc18 = new ActionDescriptor();
    var idtypeID = stringIDToTypeID( "typeID" );
    desc18.putInteger( idtypeID, 1 );
    var idType = charIDToTypeID( "Type" );
    desc18.putInteger( idType, 1 );
    var idPath = charIDToTypeID( "Path" );
    desc18.putString( idPath, "%%_ENVIRONMENT_MAP_PATH_%%" );
    var idNw = charIDToTypeID( "Nw  " );
        var desc19 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc19.putString( idNm, "" );
        var idMd = charIDToTypeID( "Md  " );
        var idGrys = charIDToTypeID( "Grys" );
        desc19.putClass( idMd, idGrys );
        var idWdth = charIDToTypeID( "Wdth" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc19.putUnitDouble( idWdth, idRlt, 870.000000 );
        var idHght = charIDToTypeID( "Hght" );
        var idRlt = charIDToTypeID( "#Rlt" );
        desc19.putUnitDouble( idHght, idRlt, 600.000000 );
        var idRslt = charIDToTypeID( "Rslt" );
        var idRsl = charIDToTypeID( "#Rsl" );
        desc19.putUnitDouble( idRslt, idRsl, 72.000000 );
        var idpixelScaleFactor = stringIDToTypeID( "pixelScaleFactor" );
        desc19.putDouble( idpixelScaleFactor, 1.000000 );
        var idFl = charIDToTypeID( "Fl  " );
        var idFl = charIDToTypeID( "Fl  " );
        var idBckC = charIDToTypeID( "BckC" );
        desc19.putEnumerated( idFl, idFl, idBckC );
        var idDpth = charIDToTypeID( "Dpth" );
        desc19.putInteger( idDpth, 8 );
        var idprofile = stringIDToTypeID( "profile" );
        desc19.putString( idprofile, "Dot Gain 20%" );
    var idDcmn = charIDToTypeID( "Dcmn" );
    desc18.putObject( idNw, idDcmn, desc19 );
    var idkeythreeDName = stringIDToTypeID( "key3DName" );
    desc18.putString( idkeythreeDName, "Foto3Dmtl" );
executeAction( idsetthreeDMaterialTexturePath, desc18, DialogModes.NO );


}

function NewDocumentModeFromDocumentMode (mode)
{
	if (mode == DocumentMode.BITMAP)
	{
		return NewDocumentMode.BITMAP;
	}
	else if (mode == DocumentMode.CMYK)
	{
		return NewDocumentMode.CMYK;
	}
	else if (mode == DocumentMode.DUOTONE)
	{
		return NewDocumentMode.DUOTONE;
	}
	else if (mode == DocumentMode.GRAYSCALE)
	{
		return NewDocumentMode.GRAYSCALE;
	}
	else if (mode == DocumentMode.INDEXEDCOLOR)
	{
		return NewDocumentMode.INDEXEDCOLOR;
	}
	else if (mode == DocumentMode.LAB)
	{
		return NewDocumentMode.LAB;
	}
	else if (mode == DocumentMode.MULTICHANNEL)
	{
		return NewDocumentMode.MULTICHANNEL;
	}
	else // if (mode == DocumentMode.RGB)
	{
		return NewDocumentMode.RGB;
	}
}


// Add Layer From 3D File
function Add3DLayerFromFile (addFromFile) 
{
	// We need to make a file list from the path we were passed.
	// You can actually open a whole list of 3D paths, but this function only takes a single path.
	var fileList = new ActionList();
	fileList.putPath( addFromFile );
	
	// Pack the file list into the action descriptor for this action.
	var add3DLayerDescriptor = new ActionDescriptor();
	add3DLayerDescriptor.putList( stringIDToTypeID( "fileList" ), fileList );
	
	// Fire off the action.
	executeAction( stringIDToTypeID( "add3DLayerFromFile" ), add3DLayerDescriptor, DialogModes.NO );	

	$.gc();  // Needed?
}


function PurgeTextureCaches (filePath)
{
	// Purging caches doesn't have any effect on the texture bug.
//	app.purge( PurgeTarget.ALLCACHES )

	// Can we avoid the overhead of opening our document and still get the caches flushed?
//	app.documents.add( 1, 1, 72.0, " ", NewDocumentMode.RGB, DocumentFill.TRANSPARENT ).close( SaveOptions.DONOTSAVECHANGES )
		// Nope.  This doesn't do anything to flush the cache.

	// Going through a document "Open" process seems to clear the texture caches.
	var fileRef = new File( filePath )

	app.open( fileRef ).close( SaveOptions.DONOTSAVECHANGES )
//	app.load( fileRef ).close( SaveOptions.DONOTSAVECHANGES )
		// And how does open() differ from load()?  load() doesn't return the new document.
}
