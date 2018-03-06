/**
 * Anonymous function to keep global namespace clean
 */
(function (_c) {

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
        add: function (text_id, text_name, text_content) {
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
        setByID: function (id, plain) {
            texts[id].plain = plain;
        },

        /**
         * Returns the text with the provided ID
         * @param {String} id   the id of the text you want to retrieve 
         */
        getByID: function (id) {
            return texts[id];
        },

        /**
         * Returns the text associated with the provided name
         * @param {String} name the name of the text you want to retrieve
         */
        getByName: function (name) {
            var ids = Object.keys(texts), id;
            for (var i = 0; i < ids.length; i++) {
                id = ids[i];
                if (texts[id].name == name) return texts[id];
            }
        },

        /**
         * Returns all the ids in an array.
         */
        getAllIDs: function () {
            return Object.keys(texts);
        },


        /**
         * Returns the original HTML file now inculding the tags we wanted to export
         */
        getSaved: function () {
            //Make an empty selection of matches we want to export
            var selectedMatches = [];
            //List of texts we're exporting to
            var usedTexts = [];

            //First get the complete selection of matches that we want to export
            $('#selectionOverview .selectionSummary').each(function (index, summary) {
                var cells = $(summary).find('.border-right');
                var cellA = cells.eq(0);
                var cellB = cells.eq(1);
                var cMatch = {
                    idA: cellA.attr('text-id'),
                    idB: cellB.attr('text-id'),
                    urnA: cellA.attr('match-urn'),
                    urnB: cellB.attr('match-urn'),
                }
                cMatch.compA = cMatch.idA + cMatch.urnA;
                cMatch.compB = cMatch.idB + cMatch.urnB;
                selectedMatches.push(cMatch);
                //Add the id's of the two texts if they haven't been added yet
                if (usedTexts.indexOf(cMatch.idA) == -1) usedTexts.push(cMatch.idA);
                if (usedTexts.indexOf(cMatch.idB) == -1) usedTexts.push(cMatch.idB);
            });

            //Now load each of the used texts into a temporary object
            var texts = {};
            for(var i = 0; i < usedTexts.length; i++){
                texts[usedTexts[i]] = comparativus.text.getByID(usedTexts[i]).data;
            }
            
            //Now go through all selectedMatches and add them to the text
            for(var i = 0; i < selectedMatches.length; i++){
                var cMatch = selectedMatches[i];
                var textA = texts[cMatch.idA];
                var textB = texts[cMatch.idB];
                //Then convert it to indeces in that text
                var indecesA = comparativus.urn.toIndeces(textA, cMatch.urnA);
                var indecesB = comparativus.urn.toIndeces(textB, cMatch.urnB);

                //Get the opening and closing match marks
                var openA = comparativus.ui.getMarkusMark(true, cMatch.compA, cMatch.compB);
                var openB = comparativus.ui.getMarkusMark(true, cMatch.compB, cMatch.compA);
                var closeA = comparativus.ui.getMarkusMark(false, cMatch.compA, cMatch.compB);
                var closeB = comparativus.ui.getMarkusMark(false, cMatch.compB, cMatch.compA);

                //Now insert the marks into text A, if the exact same matchmark is not yet in there
                if(textA.indexOf('comparativusURN="' + cMatch.compA + '"') == -1){
                    texts[cMatch.idA] = textA.substring(0, indecesA[0]) + openA
                                    +   textA.substring(indecesA[0], indecesA[1]) 
                                    +   closeA + textA.substring(indecesA[1]);
                }else{
                    //Add data to the existing tag

                    //Get ref to the spad and set content
                    var text = comparativus.util.getScratch();
                    comparativus.util.setScratch(textA);

                    //Find any existing tag in it
                    var tag = text.find('[comparativusURN="' + cMatch.compA + '"]');
                    var list = tag.attr('comparativusLINKS');
                    list = list ? list : [];
                    tag.attr('comparativusLINKS', list.length > 0 ? "|" : "" + cMatch.compB);
                    texts[cMatch.idA] = text.html();
                }
                //Same thing for textB
                if(textB.indexOf('comparativusURN="' + cMatch.compB + '"') == -1){
                    texts[cMatch.idB] = textB.substring(0, indecesB[0]) + openB
                                +   textB.substring(indecesB[0], indecesB[1]) 
                                +   closeB+ textB.substring(indecesB[1]);
                }else{
                    //Add data to the existing tag

                    //Get ref to the spad and set content
                    var text = comparativus.util.getScratch();
                    comparativus.util.setScratch(textB);

                    //Find any existing tag in it
                    var tag = text.find('[comparativusURN="' + cMatch.compB + '"]');
                    var list = tag.attr('comparativusLINKS');
                    list = list ? list : [];
                    tag.attr('comparativusLINKS', list.length > 0 ? "|" : "" + cMatch.compA);
                    texts[cMatch.idB] = text.html();
                }
            }

            //Now that all matches have been added, the texts should be done
            var nWin = window.open();
            nWin.document.write("<pre>" +
            texts[Object.keys(texts)[1]]
            + "</pre>");
        },

        /**
         * REturns a fraction [0-1] of the length this text takes of the totla
         * lenght of all texts compared
         */
        getPercentLength: function (id) {
            var totalLength = 0;
            Object.keys(texts).forEach(function (text_id) {
                totalLength += texts[text_id].plain.length;
            });
            return texts[id].plain.length / totalLength;
        },

        /**
         * Returns a JSON string encoding the length, name and group of every text we have
         */
        getJSON: function () {
            //The array that will hold the text info objects
            var json = [];
            //Enumerate all registered texts
            var ids = Object.keys(texts);
            //Keep a counter of the number of texts for their group number
            var counter = 0, text;
            //For each, append a piece of JSON
            ids.forEach(function (id) {
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
        amt: function () {
            return Object.keys(texts).length;
        },

        /**
         * Prepares all text for comparison (stripWhitespace etc)
         */
        prepareAll: function () {
            //Prepare each of the texts
            Object.keys(texts).forEach(function (id) {
                comparativus.worker.prepareText(id);
            });
        },

        /**
         * Decorates the specified text using the provided nodes
         * @param {String} id the id of the text we want to decorate
         * @param {Array} nodes the array of nodes of matches we have in our text
         */
        decorate: function (id, nodes) {
            //Get the original unstripped text
            var text = comparativus.text.getByID(id).data;
            //Prepare the holder for the new indeces
            var indeces, urnid;
            //Now add each node to the text
            nodes.forEach(function (node) {
                indeces = comparativus.urn.toIndeces(text, node.urn);
                urnid = id + node.urn;
                //Now insert the marks
                text = text.substring(0, indeces[0]) + comparativus.ui.getMatchMark(true, urnid)
                    + text.substring(indeces[0], indeces[1]) + comparativus.ui.getMatchMark(false, urnid)
                    + text.substring(indeces[1]);
            });
            //Now set the filepanel to the correct content
            comparativus.ui.setFilePanelContent(id, text);
        },

        /**
         * Returns the color on the D3 ordinal color scale used for the visualization
         * for the index of this text.
         */
        getVisColor: function (id) {
            return comparativus.vis.color(Object.keys(texts).indexOf(id));
        }
    }
})(comparativus);