/**
Starts after document load.
**/
$(document).ready(function (){
    //Start loading all modules
    initModules();

    //Then check if we're running a local version or not
    if(comparativus.util.isDebug()){
        initFiles(true);
    }else{

        //Apparently we're running the online version, so start loading the list of files
        //from the auth/ server. This also means that you should be presented with a 
        //file input dialog choosing one of the files from here if the URL GET variablres
        //didnt specify two files to load.
        $.get("http://dh.chinese-empires.eu/auth/list_files/", function(data){
            comparativus.file.list = data;

            //Only start initializing after we've received the file list from the server
            initFiles(false);
        });
            
    }
});

/**
 * Calls initializing functions for the modules that require them. This happens before
 * the loading of any AJAX calls and therefore should not require the presence of 
 * files likes 'list_files' in comparativus.file.list
 */
function initModules(){
    //Call the init function for modules that need it
    comparativus.worker.init();   
    comparativus.ui.init();
    comparativus.visualization.init();
    comparativus.popover.init();
}

/**
 * Calls the necessary functions to, depending on environment (production / dev), 
 * load either some dev data files or to actually parse the user input in the GET
 * variables. Called after ajax calls like list_files have succeeded. 
 */
function initFiles(debug){ 
    if(!debug){

        //Load the files from the GET URL variables
        var idA = comparativus.util.getURLVar('idA');
        comparativus.file.loadFromID(idA, function(data){
          comparativus.file.populateFileHolder(data, 'a', comparativus.file.getTitleFromID(idA));
        });
        var idB = comparativus.util.getURLVar('idB');
        comparativus.file.loadFromID(idB, function(data){
          comparativus.file.populateFileHolder(data, 'b', comparativus.file.getTitleFromID(idB));
        });    
    }else{

        //Load the data files from disc
        $.ajax('data/Mencius.txt', {success:function(data){
        comparativus.file.populateFileHolder(data, 'a', 'Mencius.txt');
        }});
        $.ajax('data/ZGZY.txt', {success:function(data){
        comparativus.file.populateFileHolder(data, 'b', 'ZGZY.txt');
        }});
    }   
}