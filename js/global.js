/**
Starts after document load.
**/
$(document).ready(function (){
    //Start loading all modules
    initModules();

    //Based on the debug variable, decide where we load the list of files from
    var listFilesURL = "http://dh.chinese-empires.eu/auth/list_files/";
    if(comparativus.util.isDebug()) listFilesURL = "./data/list_files.json";
    
    //Then load the list files from the right location
    $.get(listFilesURL, function(data){  
        //Assign the file list
        comparativus.file.list = data;
        //Only start initializing after we've received the file list from the server
        initFiles();
    });
        
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
function initFiles(){ 
    if(!comparativus.util.isDebug()){
        //Load the files from the GET URL variables
        var files = comparativus.util.getURLVar('files');
        files.split(',').forEach(function(id){
            comparativus.file.loadFromID(id, function(data){
                comparativus.text.add(id, comparativus.file.getTitleFromID(id), data);
            });
        });
    }else{
        //Load the data files from disc
        $.ajax('data/Mencius.txt', {success:function(data){
            var idA = '5a15793ed272f335aab275af'
            comparativus.text.add(idA, comparativus.file.getTitleFromID(idA), data);
        }});
        $.ajax('data/ZGZY.txt', {success:function(data){
            var idB = '5a1579a3d272f335aab275b0';
            comparativus.text.add(idB, comparativus.file.getTitleFromID(idB), data);
        }});
    }   
}