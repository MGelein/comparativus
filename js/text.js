/**
 * Anonymous function to keep global namespace clean
 */
(function(_c){
    
    /**
     * Holds all the text objects as objects under their keys
     */
    var texts = {};
    
    /**
     * The publicly accesible text module.
     */
    _c.text = {
        /**
         * Numerical value that keeps track of the number of texts that still need to be decorated
         */
        toDecorate: 0,

        /**
         * Adds a new text to the text storage
         */
        add: function(text_id, text_name, text_content){
            texts[text_id] = {
                name: text_name,    //the name of the text
                data: text_content, //the html content of the text precleaned
                plain: ""           //the cleaned stripped text
            }
            //Then change the ui now that we've saved it
            comparativus.ui.addFileTab(text_id, text_name, text_content);
        },

        /**
         * Sets the plain text of a specified text
         */
        setByID: function(id, plain){
            texts[id].plain = plain;
        },

        /**
         * Returns the text with the provided ID
         * @param {String} id   the id of the text you want to retrieve 
         */
        getByID : function(id){
            return texts[id];
        },

        /**
         * Returns the text associated with the provided name
         * @param {String} name the name of the text you want to retrieve
         */
        getByName: function(name){
            var ids = Object.keys(texts), id;
            for(var i = 0; i < ids.length; i++){
                id = ids[i];
                if(texts[id].name == name) return texts[id];
            }
        },

        /**
         * Returns all the ids in an array.
         */
        getAllIDs: function(){
            return Object.keys(texts);
        },

        /**
         * Returns a JSON string encoding the length, name and group of every text we have
         */
        getJSON: function(){
            //The array that will hold the text info objects
            var json = [];
            //Enumerate all registered texts
            var ids = Object.keys(texts);
            //Keep a counter of the number of texts for their group number
            var counter = 0, text;
            //For each, append a piece of JSON
            ids.forEach(function(id){
                text = texts[id];
                json.push(
                    {
                        name: text.name,
                        'id': id,
                        textLength: text.data.length,
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
            return Object.keys(texts).length;
        },

        /**
         * Prepares all text for comparison (stripWhitespace etc)
         */
        prepareAll: function(){
            //Prepare each of the texts
            Object.keys(texts).forEach(function(id){
                comparativus.worker.prepareText(id);
            });
        }
    }
})(comparativus);