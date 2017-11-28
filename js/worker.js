/**
 * Namespacing
 */
(function(_c){

    /** 
     * Makes sure the messages are always nicely formatted according to my expectations.
     * Meaing: always define an action and params
     */
    var message = function(action, parameters){
        comparativus.worker.thread.postMessage({'action' : action, 'params' : parameters});
    };

    /**
     * Contains the messaging interface with the workers
     */
    _c.worker = {
        /**
         * Reference to the single thread we're working with
         */
        thread: undefined,

        /**
         * Does all the necessary thread initialization. Creates the new 
         * Webworker and assigns a message handler.
         */
        init: function(){
            //create a new thread (force refresh in debug)
            var workerFileURL = 'js/thread.js';
            if(comparativus.util.isDebug()) workerFileURL += "?v=" + (new Date()).getTime();
            
            //Finally create a worker from the created url
            comparativus.worker.thread = new Worker(workerFileURL);
    
            //And assign the correct handler function for workers
            comparativus.worker.thread.onmessage = comparativus.worker.onmessage;
        },

        /**
         * Messages the worker to prepare the text for usage
         * This function loads data files from disk. Just used for 
         * testing purposes. Don't clean the file again if it is already loaded
         */
        loadDataFile: function(name, data){
            //console.log('Loading Data file: ' + name);
            var config = {
              'stripWhiteSpace': $('#stripWhiteSpace').val(),
              'stripPunctuation': $('#stripPunctuation').val()
            };
            message('prepareText', {'textName': name, 'text': data, 'config': config});          
        },

        /**
         * Messages the worker to start building the dictionary.
         * Builds the dictionary for the text that is registered under
         * the provided name
         */
        buildDictionary: function(name){
            message('buildDictionary', {textName:name, text: comparativus.texts[name]});
        },

        /**
         * Decorates the text that is registered under the provided
         * name with the matches found in the comparison. Also 
         * adds the edits back in the text (the special characters
         * that were previously taken out)
         */
        decorateText: function(name, matches, edits){
            message('decorateText', {textName:name, text: comparativus.texts[name], match:matches, 'edits': edits});
        },

        /**
         * What happens when the main thread recieves a message from the worker. This is all defined 
         * in this function
         */
        onmessage: function(event){
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
    };
           
})(comparativus);