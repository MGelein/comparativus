/**
 * Anonymous function to keep global namespace clean
 */
(function(_c){
    /**
     * Holds the text objects as values under the keys of their id's
     */
    var idToContent = {};

    /**
     * Hash table of every name with the id it belongs to
     */
    var idToNames = {};

    /**
     * Hash table of every id with the name it belongs to
     */
    var nameToID = {};

    /**
     * The publicly accesible text module.
     */
    _c.text = {
        /**
         * Numerical value that keeps track of the number of texts that still need to be decorated
         */
        toDecorate,

        /**
         * Adds a new text to the text storage
         */
        add: function(text_id, text_name, text_content){
            idToContent[text_id] = text_content;
            idToNames[text_id] = text_name;
            nameToID[text_name] = text_id;
            //Then change the ui now that we've saved it
            comparativus.ui.addFileTab(text_id, text_name, text_content);
        },

        /**
         * Sets the content of the text specified by the id to the provided
         * content. Hopefully not necessary after some work
         */
        setByID: function(id, text){
            idToContent[id] = text;
        },  

        /**
         * Returns the text with the provided ID
         * @param {String} id   the id of the text you want to retrieve 
         */
        getByID : function(id){
            return idToContent[id];
        },

        /**
         * Returns the text associated with the provided name
         * @param {String} name the name of the text you want to retrieve
         */
        getByName: function(name){
            return idToContent[nameToID[name]];
        },

        /**
         * Returns all the ids in an array.
         */
        getAllIDs: function(){
            return Object.keys(idToNames);
        },

        /**
         * Returns a JSON string encoding the length, name and group of every text we have
         */
        getJSON: function(){
            //The array that will hold the text info objects
            var json = [];
            //Enumerate all registered texts
            var ids = Object.keys(idToNames);
            //Keep a counter of the number of texts for their group number
            var counter = 0;
            //For each, append a piece of JSON
            ids.forEach(function(id){
                json.push(
                    {
                        name: idToNames[id],
                        'id': id,
                        textLength: idToContent[id].length,
                        group: counter
                    }
                )
                counter++;
            });

            return json;
        },

        /**
         * Returns the amount of texts this comparison is made up of
         * It figures this out by coutning the amount of keys in idToNames
         */
        amt: function(){
            return Object.keys(idToNames).length;
        },

        /**
         * Prepares all text for comparison (stripWhitespace etc)
         */
        prepareAll: function(){
            //Prepare each of the texts
            Object.keys(idToNames).forEach(function(id){
                comparativus.worker.prepareText(id);
            });
        }
    }
})(comparativus);