General
=======

Strata Foto 3D CX 2.0 (Foto 3D CX) is a program for generating 3D models from images.

A separate user guide explains how to take suitable images to use with Foto 3D CX.

This readme document covers some of the known issues with using Foto 3D CX and recommended system configuration.

PC Recommendation
-----------------

Microsoft Windows Vista
Microsoft Windows XP
Microsoft Windows 2000 (Service Pack 4, or above).

Note:
Microsoft Windows 95, Windows 98, Windows NT are not supported.

Uninstalling Foto 3D CX
--------------------

To uninstall this software, use the "Add/Remove Programs Wizard" from the Windows Control Panel. We recommend uninstalling demo versions before installing the full licensed version of the software.

Known Issues and Tips
=====================

Graphics Driver
---------------

Foto 3D CX may not work correctly with some older graphics drivers. For instance, there is a known problem with the paint tool when using certain combinations of graphics controllers and graphics drivers. This problem can be fixed by updating to the latest version of the driver. In general you should always use the latest version of the graphics driver for your graphics controller.

File I/O
--------

Number of pixels and orientation of pictures:
All pictures used in Foto 3D CX must be the same size in both width and height.

Mask file name and file location:
Foto 3D CX assumes that the masks have the same file name as the original image file names, with file extension ".PNG" or ".PGM". The directory is user-specified. Choose PNG format if you require editing the masks in Photoshop.

Copy and Paste view in texture editing:
When using copy and paste view to edit the texture map using a 3rd party package, it is important that the image is not resized at all during editing. The image should also remain in 24bit RGB format.

Sharing Foto 3D CX file with another PC: 
To copy a .SOM file to another PC, copy the original image files as well as the .SOM file. They need to be in the same directory as the .SOM file.

Cameras
-------

High-end large format camera restriction:
Some problems in generating accurate models have been reported with high-end cameras in which the optical centre is not at the centre of the image. If you have this problem, please use a standard camera.


Mouse wheel support for zooming
-------------------------------

On some mouse driver or mouse utility settings the mouse wheel can not be used to zoom-in/out on the paint and view windows. In this case use the zoom-mode button on the "View" tab and the zoom-in, zoom-out buttons on the "Paint" tab.

Export to VRML
--------------

Once the VRML file has been produced it can be rendered using a standard VRML viewer. The quality of the rendered VRML model depends on the viewer used to render the model. Occasionally we have noticed narrow line and "blinking" artifacts in the models. We have found that best results can be obtained using DirectX or OpenGL renderers.

Copyright notice
================

Strata Foto 3D CX is Copyright (c) 2004-9 Creative Dimension Software Ltd. Portions Copyright (c) 2009 Corastar, Inc. Please see the additional information avaliable by pressing the "More Info" button on the About screen within Foto 3D CX.

Trademarks
----------

Strata and Foto 3D CX are trademarks of Corastar, Inc.

Microsoft, Windows 95, Windows 98, Windows NT, Windows XP and Windows 2000 are trademarks of Microsoft Corporation. Adobe and Photoshop are trademarks of Adobe Systems Incorporated.

All other trademarks and registered trademarks are trademarks or registered trademarks of their respective owner.