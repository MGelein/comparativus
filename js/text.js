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
            //Also register that the text is now loaded
            comparativus.file.setLoadedStatus(text_id, true);
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
         * REturns a fraction [0-1] of the length this text takes of the totla
         * lenght of all texts compared
         */
        getPercentLength: function(id){
            var totalLength = 0;
            Object.keys(texts).forEach(function(text_id){
                totalLength += texts[text_id].plain.length;
            });
            return texts[id].plain.length / totalLength;
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
        },

        /**
         * Decorates the specified text using the provided nodes
         * @param {String} id the id of the text we want to decorate
         * @param {Array} nodes the array of nodes of matches we have in our text
         */
        decorate: function(id, nodes){
            //Get the original unstripped text
            var text = comparativus.text.getByID(id).data;
            //Prepare the holder for the new indeces
            var indeces, urnid;
            //Now add each node to the text
            nodes.forEach(function(node){
                indeces = comparativus.urn.toIndeces(text, node.urn);
                urnid = id + node.urn;
                //Now insert the marks
                text = text.substring(0, indeces[0]) + comparativus.ui.getMatchMark(true, urnid) 
                    + text.substring(indeces[0], indeces[1]) + comparativus.ui.getMatchMark(false, urnid) 
                    + text.substring(indeces[1]);
            });
            //Now set the filepanel to the correct content
            comparativus.ui.setFilePanelContent(id, text);
        }
    }
})(comparativus);