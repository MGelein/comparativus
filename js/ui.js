/**
 * Anonymous namespace of this file to prevent polluting of the global namespace
 */
(function(_c){

    _c.ui = {
        /**
         * This function adds the event listeners to the ui objects
         * and inputs.
         */
        addListeners: function(){
            //Handler for the comparisonButton
            $('#comparisonButton').unbind('click').click(function(){
                console.log("Asked to start");
                var aEmpty = ($('#textA').html() == "" );
                var bEmpty = ($('#textB').html() == "" );
                if(aEmpty || bEmpty) return;

                //unbinds the click handler, to prevent more clicking during comparison
                $(this).unbind('click');
            
                comparativus.dicts.toBuild = 2;
                comparativus.ui.setComparisonButtonText('Preparing texts for comparison...');
                comparativus.ui.showLoadingAnimation(true);
                comparativus.worker.loadDataFile('a', $('#textA').text());
                comparativus.worker.loadDataFile('b', $('#textB').text());
            });

            //set popover to have with relative to the main body
            $('[data-toggle="popover"]').unbind('popover').popover({
                container: 'body'
            });
            //activate popovers
            $('[data-toggle="popover"]').unbind('popover').popover();

            //FIle input change listeners
            $('#fInputA').unbind('change').change(function(event){comparativus.file.readSingle(event, 'a')});
            $('#fInputB').unbind('change').change(function(event){comparativus.file.readSingle(event, 'b')});
            
        },

        /**
         * Sets the text on the comparison button to the provided text parameter
         */
        setComparisonButtonText : function(text){
            $('#comparisonButtonText').html(text);
        },

        /**
         * Enables or disables the loading animation on the comparison button
         */
        showLoadingAnimation: function(enabled){
            if(enabled){
                $('#comparisonButtonIcon').removeClass().addClass('glyphicon glyphicon-repeat rotating');
            }else{
                $('#comparisonButtonIcon').removeClass().addClass('glyphicon glyphicon-refresh');
            }
        },

        /**
         * Sets the similarity spane value to the provided value
         */
        setSimilarityScore: function(val){
            $('#simScore').html(val);
        },

        /**
         * Sets the file panel with the provided name to the provided content
         */
        setFilePanelContent: function(name, content){
            $('#text' + name.toUpperCase()).html(content);
        },

        /**
         * Returns the minimum match size. This is the value
         * of the minimum match size input element on the GUI.
         */
        getMinMatchSize: function(){
            return Math.round(Number($('#minimumMatchSize').val()));
        },

        /**
        Checks the minimumMatchSize value. This should be a valid integer.
        **/
        checkMinMatchSize: function(el){
            el.value = Math.round(Number(el.value));
            if(el.value == 0) el.value = 10;
        },
        /**
         * Highlights all matches in the text from the linkID
         */
        highlightMatchFromLinkID: function(linkID, enabled){
            var id = "#S" + linkID.replace(/[AB]/g, '') + 'a'; 
            console.log(id);
            comparativus.ui.highLightMatch($(id), enabled);
            if(enabled) setTimeout(function(){comparativus.ui.highlightMatchFromLinkID(linkID, false);}, 2000);
        },

        /**
         * Loads the provided array of matches into 
         * the result table
         */
        showResultTable: function(matches){            
            //now show all matches in the browser
            var parts = [];
            parts.push("<thead><tr><th>IndexA</th><th>IndexB</th><th>Length</th><th>TextA</th><th>TextB</th></tr></thead><tbody>");
            var tsvParts = [];
            var cMatch; var max = matches.length;
            $('#matchesAmt').html(max);
            for(var i = 0; i < max; i++){
                cMatch = matches[i];
                var linkID = 'A' + cMatch.indexA + 'B' + cMatch.indexB;
                parts.push("<tr id='row" + linkID +"'><td><a class='matchLink' onmouseup='comparativus.ui.highlightMatchFromLinkID(\"" + linkID + "\", true);'" + i + 'a' + "'>" + cMatch.indexA +
                "</a></td><td><a class='matchLink' onmouseup='comparativus.ui.highlightMatchFromLinkID(\"" + linkID + "\", true);'" + i + 'a' + "'>" + cMatch.indexB +
                "</td><td>" + cMatch.l + "</td><td>" + cMatch.textA + "</td><td>"
                + cMatch.textB + "</td></tr>");
                tsvParts.push(cMatch.indexA + '\t' + cMatch.indexB + '\t' + cMatch.l + '\t' + cMatch.r + '\t' + cMatch.textA + '\t' + cMatch.textB);
            }

            $("#resultTable").html(parts.join() + "</tbody>");

            //create the downloadButtons
            $('#downloadTSVButton').click(function(){createTSVFile(tsvParts);});
            $('#downloadJSONButton').click(function(){comparativus.file.createJSON(matches);});
        }
    }
})(comparativus);