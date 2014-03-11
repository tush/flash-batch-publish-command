// Author: Tushar Wadekar
// Description: Publish Files Command
// Contact: tusharwadekar@gmail.com 
// URL: http://tush.wordpress.com
// Ver: 1.4
// Last modified on: 03 July 2008
var UserInput;
var FolderPath;
var includeSubFolder;
var foldersArray;
var readOnlySWF;
var _path;
var _publishProfileFile;
var _publishProfile;
var _saveFile;
var closeDocOnFinish = false;
var tmpDoc;
var exportPath;
function getFolderPath() {
	if(fl.getDocumentDOM() != null) {
		tmpDoc = fl.getDocumentDOM();
		readOnlySWF = new Array();
		foldersArray = new Array();
		includeSubFolder = false;
		_publishProfile = false;
		_saveFile = false;
		_publishProfileFile = "";
		FolderPath = "";	
		exportPath = "";
		UserInput = tmpDoc.xmlPanel(fl.configURI+"Commands/PublishFilesPanel.xml");	
		if(UserInput.dismiss == "accept") {
			if(UserInput.subFolder == "true"){		
				includeSubFolder = true;
			}
			if(UserInput.PublishProfile == "true"){		
				_publishProfile = true;
			}
			if(UserInput.SaveFile == "true"){		
				_saveFile = true;
			}
			if (UserInput.ExportPath != "") {				
				if (UserInput.ExportPath.indexOf("\\") != -1) {					
					exportPath = trimSlash(UserInput.ExportPath);
				} else {			
					exportPath = UserInput.ExportPath;
				}						
				//exportPath = "file:///"+exportPath;
				if (exportPath.substr(exportPath.length-1, exportPath.length) != "/") {
					exportPath = exportPath+"/";
				}
				if (!FLfile.exists(exportPath)) {
					alert("Invalid Export Path");
					getFolderPath();
					return;
				}
			}
			if (UserInput.PublishProfilePath != "") {				
				if (UserInput.PublishProfilePath.indexOf("\\") != -1) {					
					_publishProfileFile = trimSlash(UserInput.PublishProfilePath);
				} else {			
					_publishProfileFile = UserInput.PublishProfilePath;
				}						
				//_publishProfileFile = "file:///"+_publishProfileFile;
			}
			if(_publishProfile && _publishProfileFile == ""){		
				alert("Please provide Publish Profile.\nOr uncheck Change Publish Profile option.");
				getFolderPath();
				return;
			}
			if(_publishProfile && !isValid(_publishProfileFile, "xml")){		
				alert("Please provide valid Publish Profile.\nOr uncheck Change Publish Profile option.");
				getFolderPath();
				return;
			}
			if (UserInput.Path != "") {
				if (UserInput.Path.indexOf("\\") != -1) {
					//alert("Using 'Back Slash'(\\) is not allowed.\nPlease use 'Front Slash'(/) instead.");
					//getFolderPath();
					_path = trimSlash(UserInput.Path);
				} else {			
					_path = UserInput.Path;
				}		
				if (_path.substr(_path.length-1, _path.length) == "/") {
					//FolderPath = "file:///"+_path;
					FolderPath = _path;
				} else {
					//FolderPath = "file:///"+_path+"/";
					FolderPath = _path+"/";
				}
				if (FLfile.exists(FolderPath)) {
					var attributes = FLfile.getAttributes(FolderPath.substr(0, FolderPath.length-1));
					if (attributes.indexOf("R") == -1) {					
						if (includeSubFolder) {
							var folders = FLfile.listFolder(FolderPath.substr(0, FolderPath.length-1), "directories");
							foldersArray.push(FolderPath);
							if (folders != "") {
								var i = folders.length;
								while (i--) {
									var currFolder = FolderPath+folders[i]+"/";
									foldersArray.push(currFolder);
									checkSubFolders(currFolder);								
								}
								delete i;
							}
						} else {
							foldersArray.push(FolderPath);
						}					
						publishDocuments();
					} else {
						alert("Folder is Read Only.");
						getFolderPath();
					}
					delete attributes;
				} else {
					alert("Folder not found.");
					getFolderPath();
				}
			} else {
				alert("Please provide folder path.");
				getFolderPath();
			}
		} else {
			closeTempDocument();
		}
	} else {
		fl.createDocument();
		closeDocOnFinish = true;
		getFolderPath();
	}
}
function publishDocuments() {
	var j = foldersArray.length;	
	var cnt = 0	
	while (j--) {
		var currFolder = foldersArray[j];
		var availableFla = FLfile.listFolder(currFolder+"*.fla", "files");
		var i = availableFla.length;
		while (i--) {			
			var currDoc = fl.openDocument(currFolder+availableFla[i]);			
			if(_publishProfile){
				changePublishProfile(currDoc);
			}
			if(exportPath != "") {
				var fileName = availableFla[i].substr(0, availableFla[i].indexOf("."));
				var _expPath = exportPath+fileName+".swf";
				currDoc.exportSWF(_expPath, true);
			} else {
				currDoc.publish();			
			}
			if(_saveFile){
				//isSaved = _currDoc.save();
				//if(!isSaved){
				//	alert("Error occured while saving the file.");
				//}
				if(!currDoc.saveAndCompact()){
					alert("Error occured while saving the file.");
				}
			}
			fl.closeDocument(currDoc, true);
			delete currDoc;					
			cnt++;			
		}
		delete i;
		delete availableFla;
		// Swf Attributes		
		var availableSWF = FLfile.listFolder(currFolder+"*.swf", "files");
		var i = availableSWF.length;		
		while (i--) {
			var attributes = FLfile.getAttributes(currFolder+availableSWF[i]);
			if (attributes.indexOf("R") != -1) {
				readOnlySWF.push(currFolder+availableSWF[i]);
			}
			delete attributes;
		}
	}
	delete currFolder;
	reportReadOnlyFile();
	delete readOnlySWF;
	delete i;
	delete availableSWF;		
	if(cnt == 0){
		alert("No Flash files found.");
		fl.outputPanel.clear();
		fl.trace("///////// Publish Files Report /////////\n");
		fl.trace("Please make sure if you have provided correct folder path and you have full access to that folder.\n");
		//fl.trace("For assistance please contact author at tusharwadekar@gmail.com.\n");
		fl.trace("///////// End Report /////////\n");
	}
	closeTempDocument();
}
function checkSubFolders(folder) {
	var subFolders = FLfile.listFolder(folder.substr(0, folder.length-1), "directories");
	if (subFolders != "") {		
		for(var k = 0;k<subFolders.length;k++){		
			var Folder = folder+subFolders[k]+"/";			
			foldersArray.push(Folder);			
			checkSubFolders(Folder);
			delete Folder;
		}
		delete i;
	}
}
function reportReadOnlyFile(){
	if (readOnlySWF.length>0) {
		var SWF = "";
		for (var k = 0; k<readOnlySWF.length; k++) {
			SWF += readOnlySWF[k].substr(8, readOnlySWF[k].length)+"\n";
		}		
		fl.outputPanel.clear();
		fl.trace("///////// Publish Files Report /////////\n");
		fl.trace("Following SWF files were found as Read Only.\n\n"+SWF);
		fl.trace("///////// End Report /////////\n");
		delete k;
		delete SWF;
	}
}
function trimSlash(str){	
	var tmpArr = str.split("\\");	
	var tmpStr = tmpArr[0];
	for(var j=1;j<tmpArr.length-1;j++){
		tmpStr = tmpStr+"/"+tmpArr[j];
	}
	tmpStr = tmpStr+"/"+tmpArr[tmpArr.length-1];
	return tmpStr;
}
function isValid(str, extn){	
	var ind = str.lastIndexOf(".");	
	var tmpStr = str.substr(ind+1, str.length).toLowerCase();
	if(tmpStr == extn.toLowerCase()){
		return true;
	}
	return false;
}
function changePublishProfile(_currDoc){
	var currProfile = _currDoc.currentPublishProfile;
	var newProfile = _currDoc.importPublishProfile(_publishProfileFile);	
	if(newProfile == -1){
		alert("Error occured while importing new Publish Profile.");
	}
}
function closeTempDocument(){
	if(closeDocOnFinish){
		fl.closeDocument(tmpDoc);
	}	
}
getFolderPath();
