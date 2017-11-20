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
         * Shakes the fileInput with the provided Name
         */
        shakeFileInput: function(name){
            var fInput = $('#panel' + name.toUpperCase());
            //Start animating it
            fInput.addClass('animated jello');
            //Once the animation ends, remove the animated class
            fInput.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
              fInput.removeClass('animated jello')
            });
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
         * Highlights a match everywhere (in the visualization, in the text and the resultTable)
         */
        highlightEverywhere(linkID, enabled){
            //linkID is made of indexA + indexB
            highlightResult(linkID, enabled);
            highLightMatch($('#S' + linkID), enabled);
            comparativus.visualization.highlightPair(linkID, enabled);
        },

        /**
         * Enables or disables highlighting of the specified row in the resultTable
         */
        highlightResult: function(linkID, enabled){
            var row = $('#row' + linkID);
            if(enabled){
                row.addClass('success');
                row.get(0).scrollIntoView(false);
            }else{
                row.removeClass('success');
            }
        },

        /**
         * Highligths both the A and B occurences of the match
         */
        highLightMatch: function(element, enabled){
            var id = '#' + $(element).attr('id');
            //Highlight both the a and b version
            comparativus.ui.highLightSingleMatch($(id.replace(/.$/, 'a')).get(0), enabled);
            comparativus.ui.highLightSingleMatch($(id.replace(/.$/, 'b')).get(0), enabled);
        },

        /**
         * Highlight one single match. The provided element is the element the mouse hovered over
         */
        highLightSingleMatch: function(element, enabled){
            var elID = $(element).attr('id');
            var otherName = (elID.startsWith("S") ? "E" : "S") + elID.substring(1);
            var startMatch = (elID.startsWith("S") ? ('#' + elID) : ('#' + otherName));
            var endMatch = (elID.startsWith("S") ? ('#' + otherName) : ('#' + elID));

            //Only contents() also picks up on text nodes. 
            var id; var adding = false;
            var selection = $();
            $(startMatch).parent().contents().each(function(){
                if('#' + $(this).attr('id') == startMatch){//We found the beginning
                    adding = true;
                }else if('#' + $(this).attr('id') == endMatch){
                    adding = false;
                    selection = selection.add($(this));
                    return false;
                }
                if(adding) selection = selection.add($(this));
            });
            
            if(enabled){
                selection.wrap('<span class="selectedSpan">');
                //Scroll each of the selected spans into view
                $('.selectedSpan').each(function(){$(this).get(0).scrollIntoView(false)});
                $(endMatch).addClass('selected');
                $(startMatch).addClass('selected');
            }else{
                $(endMatch).removeClass('selected');
                $(startMatch).removeClass('selected');
                //remove any selected span that was found
                $('.selectedSpan').contents().unwrap();
            }
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