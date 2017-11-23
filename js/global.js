/**
Starts after document load.
**/
$(document).ready(function (){
    /**Load the list of files */
    $.get("http://dh.chinese-empires.eu/auth/list_files/", function(data){
        comparativus.file.list = data;
        init();
    });
});

/**
 * Continued initialization after first ajax calls
 */
function init(){    
    //create a new thread
    comparativus.thread = new Worker('js/thread.js?v=17');

    comparativus.thread.onmessage = function(event){
      //it is assumed that any communication from a worker assigns these values
      var action = event.data.action;
      var params = event.data.params;
  
      //Switch based on the action parameter
      switch(action){
        case 'DictDone':
          comparativus.dicts.toBuild --;
          comparativus.dicts[params.textName] = params.dictionary;
          if(comparativus.dicts.toBuild == 0){
            console.log('Starting Comparison');
            comparativus.startComparison();
          }
        break;
        case 'DecorateDone':
          comparativus.texts.toDecorate --;
          comparativus.ui.setFilePanelContent(params.textName, params.result);
          comparativus.ui.setComparisonButtonText('Creating Text Decoration (' + comparativus.texts.toDecorate + ' left)');
          if(comparativus.texts.toDecorate == 0){
            comparativus.ui.setComparisonButtonText('(Re)Compare Texts');
            comparativus.ui.showLoadingAnimation(false);
            //Re-add listeners now that we're done with the comparison
            comparativus.ui.addListeners();
            comparativus.visualization.draw(comparativus.file.createJSON(comparativus.matches, false));
          }
        break;
        case 'PrepareDone':
          comparativus.texts[params.textName] = params.text;
          comparativus.edits[params.textName] = params.edits;
          $('#info' + name.toUpperCase()).html('Length: ' + comparativus.texts[params.textName].length + ' characters');
          $('#text' + name.toUpperCase()).html(params.text);
          comparativus.ui.setComparisonButtonText('Building dictionaries...');
          comparativus.worker.buildDictionary(params.textName);
        break;
      }
    }

    //Register the global listeners
    comparativus.ui.addListeners();
    //Initialize the visualization
    comparativus.visualization.init();
    //Initialize the popover
    comparativus.popover.init();

    //then load the texts
    var idA = comparativus.util.getURLVar('idA');
    comparativus.file.loadFromID(idA, function(data){
      comparativus.file.populateFileHolder(data, 'a', comparativus.file.getTitleFromID(idA));
    });
    var idB = comparativus.util.getURLVar('idB');
    comparativus.file.loadFromID(idB, function(data){
      comparativus.file.populateFileHolder(data, 'b', comparativus.file.getTitleFromID(idB));
    });

    //OLD TEXT LOADING STRAIGHT FROM DISK
    /*$.ajax('data/Mencius.txt', {success:function(data){
      comparativus.file.populateFileHolder(data, 'a', 'Mencius.txt');
    }});
    $.ajax('data/ZGZY.txt', {success:function(data){
      comparativus.file.populateFileHolder(data, 'b', 'ZGZY.txt');
    }});*/
    
  }