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
        }
    }
})(comparativus);