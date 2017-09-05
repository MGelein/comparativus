/**
 * Namespacing
 */
(function(_c){

    /** 
     * Makes sure the messages are always nicely formatted according to my expectations.
     * Meaing: always define an action and params
     */
    var message = function(action, parameters){
        comparativus.thread.postMessage({'action' : action, 'params' : parameters});
    };

    /**
     * Contains the messaging interface with the workers
     */
    _c.worker = {
        /**
         * Messages the worker to prepare the text for usage
         * This function loads data files from disk. Just used for 
         * testing purposes. Don't clean the file again if it is already loaded
         */
        loadDataFile: function(name, data){
            console.log('Loading Data file: ' + name);
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
        }
    };
           
})(comparativus);