"use strict";

/**
 * This is the main global comparativus object. This is used
 * to hide all methods, objects and variables from the global 
 * namespace to prevent polluting it.
 */
var comparativus = {
    build: '1.11.1',
    author: "Mees Gelein"
};

(function(_c){
    /**
     * The minimum lenght a match should be to be added to the results
     */
    _c.minMatchLength = 10;
    /**
     * Contains the array of matches that have been found
     */
    _c.matches = [];
    /**
     * Contains the araray of nodes (unique matches) that have been found. Prevents doubling of data when
     * one sequence has multiple matches in the other document
     */
    _c.nodes = {
        a: [],
        b: []
    }
    /**
     * Reference to the single thread we're currently running
     */
    _c.thread;
    /**
     * Data object that holds all the texts
     */
    _c.texts = {};

    /**
     * Data object that holds the dictionaries that have been generated
     */
    _c.dicts = {};

    /**
     * Edits object. When the text is prepared, all the spaces and special
     * characters are removed from the file and are kept in order in this file
     * together with their index. Using this object we can re-add the edits back in.
     */
    _c.edits = {};

    /**
     * Called to start the comparison between the two texts
     */
    _c.startComparison = function(){
        comparativus.ui.setComparisonButtonText('Running Comparison');
        comparativus.minMatchLength = comparativus.ui.getMinMatchSize();

        comparativus.matches = [];
        var dictA = comparativus.dicts['a'];
        var dictB = comparativus.dicts['b'];
        var seeds = Object.keys(dictA);
        var seedAmt = seeds.length;
        var overlap = [];
        var overlapSeedAmt = 0;
        var totalSeedAmt = 0;
        for(var i = 0; i < seedAmt; i++){
        totalSeedAmt += dictA[seeds[i]].length;
            if(seeds[i] in dictB){
                overlapSeedAmt += dictA[seeds[i]].length + dictB[seeds[i]].length;
                overlap.push(seeds[i]);
                comparativus.expandAllMatches(dictA[seeds[i]], dictB[seeds[i]]);
            }
        }
        //also add all seeds of text B to the total amount of seeds
        seeds = Object.keys(dictB);
        seedAmt = seeds.length;
        for(var i = 0; i < seedAmt; i++){
        totalSeedAmt += dictB[seeds[i]].length;
        }
        //console.log('Total seed Amt: ' + totalSeedAmt + ' and overlap seed Amt: ' + overlapSeedAmt + " > Similarity Score: " + overlapSeedAmt / totalSeedAmt);
        comparativus.ui.setSimilarityScore(overlapSeedAmt / totalSeedAmt)
        comparativus.ui.showResultTable(comparativus.matches);
        comparativus.texts.toDecorate = 2;
        comparativus.ui.setComparisonButtonText('Creating Text Decoration (' + comparativus.texts.toDecorate + ' left)');
        comparativus.worker.decorateText('a', comparativus.nodes.a, comparativus.edits['a']);
        comparativus.worker.decorateText('b', comparativus.nodes.b, comparativus.edits['b']);
    };

    /**
     * Expands a single match from two indeces
     * @param {Integer} iA 
     * @param {Integer} iB 
     */
    var expandMatch = function(iA, iB){
        //first check if this match is inside another match
        var max = comparativus.matches.length;
        var cMatch;
        for(var i = 0; i < max; i++){
            cMatch = comparativus.matches[i];
            if((iA < cMatch.indexA + cMatch.l) && (iA > cMatch.indexA)){
                if((iB < cMatch.indexB + cMatch.l) && (iB > cMatch.indexB)){
                //console.log("Embedded match, ignore");
                //this matching seed is inside of a match we already found
                return;
                }
            }
        }
        //console.log("Expand the match: "+ iA + "; " + iB);

        var matchLength = 10;
        var sA = comparativus.texts.a.substr(iA, matchLength);
        var sB = comparativus.texts.b.substr(iB, matchLength);
        var strikes = 0;

        //diminish to the left (if the 10 char expansion made the levDist to low)
        while(comparativus.util.levDistRatio(sA, sB) < 0.8 && matchLength > 0){
            matchLength --;
            sA = comparativus.texts.a.substr(iA, matchLength);
            sB = comparativus.texts.b.substr(iB, matchLength);
        }

        //expand right
        while(strikes < 3){
            if(comparativus.util.levDistRatio(sA, sB) < 0.8){
                strikes ++;
            }else{
                strikes = 0;
            }
            matchLength++;
            sA = comparativus.texts.a.substr(iA, matchLength);
            sB = comparativus.texts.b.substr(iB, matchLength);
            if(iA + matchLength > comparativus.texts.a.length || iB + matchLength > comparativus.texts.b.length) break;
        }
        //take off the three chars we added to much.
        matchLength -= 3;
        strikes = 0;
        sA = comparativus.texts.a.substr(iA, matchLength);
        sB = comparativus.texts.b.substr(iB, matchLength);

        //expand left
        while(strikes < 3){
            if(comparativus.util.levDistRatio(sA, sB) < 0.8){
                strikes ++;
            }else{
                strikes = 0;
            }
            matchLength++;
            iA --;
            iB --;
            if(iA < 0 || iB < 0){
                iA = iB = 0;
                break;
            }
            sA = comparativus.texts.a.substr(iA, matchLength);
            sB = comparativus.texts.b.substr(iB, matchLength);
        }
        //return the three chars we add too much
        iA += strikes; iB += strikes;
        matchLength -= strikes;
        sA = comparativus.texts.a.substr(iA, matchLength);
        sB = comparativus.texts.b.substr(iB, matchLength);

        //now it has been fully expanded. Add it to the matches object if the length
        //is greater than minLength
        if(matchLength >= comparativus.minMatchLength){
            var m = {l:matchLength, indexA:iA, indexB:iB, textA:sA, textB:sB, r:comparativus.util.levDistRatio(sA, sB)};
            comparativus.matches.push(m);
            comparativus.addNodeFromMatch(m);
            //console.log("Match found: " + m.l);
        }
    }

    /**
     * Adds new nodes to the list of them. 
     * @param {Match} match 
     */
    _c.addNodeFromMatch= function(match){
        var nA = {index: match.indexA, 'match': match};
        var nB = {index: match.indexB, 'match': match};
        var i = 0;
        //First check if node A is unique
        var max = comparativus.nodes.a.length;
        var unique = true;
        for(i = 0; i < max; i++){
            if(comparativus.nodes.a[i].index == nA.index){
                unique = false;
                break;
            }
        }
        if(unique) comparativus.nodes.a.push(nA);
        else console.log("node A was not unique");

        //Then check if node B is unique
        max = comparativus.nodes.b.length;
        unique = true;
        for(i = 0; i < max; i++){
            if(comparativus.nodes.b[i].index == nB.index){
                unique = false;
                break;
            }
        }
        if(unique) comparativus.nodes.b.push(nB);
        else console.log("node B was not unique");
    }


    /**
     * Expands all occurrences for a matching seed found in the dictionary
     */
    _c.expandAllMatches = function(occA, occB){
        var maxA = occA.length;
        var maxB = occB.length;
        var matchAIndex;
        var matchBIndex;
        for(var i = 0; i < maxA; i++){
            matchAIndex = occA[i];
            for(var j = 0; j < maxB; j++){
                matchBIndex = occB[j];
                expandMatch(matchAIndex, matchBIndex);
            }
        }   
    };
    
})(comparativus);;(function(_c){
    /**
     * Defines the utility object with some useful
     * functionality
     */
    _c.util = {
        /**
         * Returns the levenSthein ratio [0-1] similarity between
         * the two provided string. 1 means they're identical. 0
         * means they are completely different
         */
        levDistRatio : function(sA, sB){
            //instantiate vars and cache length
            var aMax = sA.length;
            var bMax = sB.length;
            var matrix = [];

            //increment the first cell of each row and each column
            for(var i = 0; i <= bMax; i++){matrix[i] = [i];}
            for(var j = 0; j <= aMax; j++){matrix[0][j] = j;}

            //calculate the rest of the matrix
            for(i = 1; i <= bMax; i++){
                for(j = 1; j <= aMax; j++){
                if(sA.charAt(i-1) == sB.charAt(j-1)){
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                            Math.min(matrix[i][j-1] + 1, // insertion
                                                    matrix[i-1][j] + 1)); // deletion
                }
                }
            }

            //0 for no likeness. 1 for complete likeness
            return 1 - (matrix[bMax][aMax] / aMax);
        },

        /**
         * Returns the value of the GET variable with the provided name.
         * If no variable was set, undefined is returned. If it is set,
         * its string is URI decoded and returned.
         */
        getURLVar: function(name){
            //for the parts of a GET assignement
            var parts;
            //Loop through each of GET key-value pairs
            var pairs = window.location.search.substring(1).split('&');
            for(var i = 0; i < pairs.length; i++){
                parts = pairs[i].split('=');
                //If this is the key-value pair we want
                if(parts[0] == name){
                    //return the value or true if this only was a key
                    return ((parts[1] === undefined) ? true : decodeURI(parts[1]));
                }
            };
        }
    };
})(comparativus);;/**
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
        }
    };
           
})(comparativus);;/**
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
})(comparativus);;/**
 * Anonymous namespace for this file
 */
(function(_c){
    /**
     * All the file and data manipulation methods
     */
    _c.file = {

        /**
         * Contains the JSON object returned upon loading the page auth/list_files
         */
        list: undefined,

        /**
         * Returns the full filename of the provided text
         */
        getName: function(name){
            return $('#fInput' + name.toUpperCase()).parent().find('.fileName').html().replace(/\.[^/.]+$/, "");
        },

        /**
         * Reads a single file into the fileInputs
         */
        readSingle: function(e, name){
            //Check the file
            var file = e.target.files[0];
            if (!file) {
              return;
            }

            //Show that we're loading in case its a big system
            $(e.target.parentNode).find('.fileName').html('Loading...');
            
            //Create the read and the onload response
            var reader = new FileReader();
            reader.onload = function(e) {
              $('#' + 'text' + name.toUpperCase()).html(e.target.result);
              $('#' + 'info' + name.toUpperCase()).html('Length: ' + e.target.result.length + ' characters');
              $($('#fInput' + name.toUpperCase()).get(0).parentNode).find('.fileName').html(file.name);
            };
          
            //Start reading the file
            reader.readAsText(file);
        },

        /**
         * Returns the file with the provided ID from the server. The file
         * is returned in the callback as a string. This is due to the asynchronous
         * nature of the file request
         * 
         * Look here for the list of file id for this user
         * http://dh.chinese-empires.eu/auth/list_files >
         * 
         * @param {String} id   the id used for the file in the filesystem
         * @param {Function} callback   takes the file data as a parameter
         */
        loadFromID: function(id, callback){
            $.get("http://dh.chinese-empires.eu/auth/get/" + id, function(data){
                callback($(data).text());
            });
        },

        /**
         * Returns the fileName that matches this ID
         */
        getTitleFromID: function(id){
            //We now know for sure that the list of files is loaded
            var file, max = comparativus.file.list.files.length;
            for(var i = 0; i < max; i++){
                file = comparativus.file.list.files[i];
                if(file._id == id) return file.fileName;
            }
            //If we don't find a match, return that
            return "No Title Found";
        },

        /**
         * 
         * @param {String} text the text to put into the textfield 
         * @param {String} name the name of the text field [a-b]
         */
        populateFileHolder: function(text, name, filename){
            console.log("text: " + text);
            console.log("name: " + name);
            console.log("filename: " + filename);
            $('#' + 'text' + name.toUpperCase()).html(text);
            $('#' + 'info' + name.toUpperCase()).html('Length: ' + text.length + ' characters');
            $($('#fInput' + name.toUpperCase()).get(0).parentNode).find('.fileName').html(filename);
        },

        /**
         * Generates the download file name based upon the texts
         * that have been compared and the file type extension provided
         */
        getDownloadName: function(type){
            var names = "Matches";
            $('.fileName').each(function(i, val){
              names += '-' + $(val).html().replace(/\.[^/.]+$/, "");
            });
            names += type.toLowerCase();
            return names;
        },

        /**
         * This method takes care of the actual downloading of the file.
         * It does this by creating a link clicking it and immediately destroying it.
         */
        download: function(fileName, href){
            var link = document.createElement("a");
            link.download = fileName;
            link.href = href;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        /**
         * Creates a JSON file describing the found matches and 
         * the compared texts. Using the second optional boolean parameter
         * you can turn off the automatic download feature and
         * use the file for internal use (D3 visualization).
         */
        createJSON: function(matches, doDownload){
            //if not specified set to true
            if(doDownload === undefined) doDownload = true;
            //convert the matches object to nodes and links
            var jsonFile = {};
            jsonFile.texts = [];
            jsonFile.texts.push(
                {
                name: comparativus.file.getName('a'),
                textLength: comparativus.texts.a.length,
                group: 0
                }
            );
            jsonFile.texts.push(
                {
                name: comparativus.file.getName('b'),
                textLength: comparativus.texts.b.length,
                group: 1
                }
            );
            jsonFile.nodes = [];
            jsonFile.links = [];
            var max = matches.length;
            var unique = true;
            var cMatch; var cNode = {}; var cLink = {};

            //this function is used to check for duplicates
            var addNode = function(n){
                for(var j = 0; j < jsonFile.nodes.length; j++){
                if(jsonFile.nodes[j].id == n.id) return;
                }
                jsonFile.nodes.push(cNode);
            }
            for(var i = 0; i < max; i++){
                cMatch = matches[i];

                //add node A
                cNode = {};
                cNode.group = 0;
                cNode.l = cMatch.l;
                cNode.index = cMatch.indexA;
                cNode.id = 'A' + cMatch.indexA;
                cNode.text = cMatch.textA;
                addNode(cNode);

                //add node B
                cNode = {};
                cNode.group = 3;
                cNode.l = cMatch.l;
                cNode.index = cMatch.indexB;
                cNode.id = 'B' + cMatch.indexB;
                cNode.text = cMatch.textB;
                addNode(cNode);

                //add the link
                cLink = {};
                cLink.source = 'A' + cMatch.indexA;
                cLink.target = 'B' + cMatch.indexB;
                cLink.l = cMatch.l;
                cLink.r = cMatch.r;
                jsonFile.links.push(cLink);
            }
            if(doDownload){
                comparativus.file.download(comparativus.file.getDownloadName('.json'),
                "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonFile)));
            }
            //return the json String for internal use
            return jsonFile;
        },

        /**
         * Generates a TSV save file. Use the generated TSV parts to make the
         * file
         */
        createTSV: function(tsvParts){
            comparativus.file.download(comparativus.file.getDownloadName('.tsv'),
            'data:text/tsv;charset=utf-8,' + encodeURI(tsvParts.join('\n')));
        }
    }
})(comparativus);;(function(_c){

    /**
     * Defined width of the svg canvas to draw on
     */
    var w = 900;
    /**
     * Defined height of the svg canvas to draw on
     */
    var h = 150;
    /**
     * The color scale to use. This is sort of an color-scheme
     */
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    /**
     * Get a reference to the SVG we will draw on
     */
    var svg;
    /**
     * Object that holds all the text -lengths ordered by their name
     */
    var textLength = {};
    /**
     * List of text names ordered by group number
     */
    textNames = [];
    /**
     * The margins of the text-bar
     */
    var textMargins = {top: 20, left: 0, bottom: 50, right: 0};

    
    /**
     * Returns a pathString that can be used to draw a curve
     * using SVG graphics.
     * @param {Array} dataset 
     * @param {String} sourceID 
     * @param {String} targetID 
     */
    var getPathDirections = function(dataset, sourceID, targetID){
        return "M" + getNodeX(dataset, sourceID) + "," + getNodeY(dataset, sourceID)
            + " C" + getNodeX(dataset, sourceID) + "," + h / 2
            + " "  + getNodeX(dataset, targetID) + "," + h / 2
            + " "  + getNodeX(dataset, targetID) + "," + getNodeY(dataset, targetID);
    }

    /**
     * Loops through all nodes to find the one described
     * by this ID
     * @param {Array} dataset 
     * @param {String} id 
     */
    var getNodeByID = function(dataset, id){  
        var i = -1;      
        while(i++ < dataset.nodes.length - 1){
            if(dataset.nodes[i].id == id) return dataset.nodes[i];
        }
    }

    /**
     * Returns all the links that are attached to the provided node
     * @param {Array} dataset 
     * @param {String} nodeName 
     */
    var getLinksByNode = function(dataset, nodeName){
        var i = -1; var temp;
        var results = [];
        while(i++ < dataset.links.length - 1){
            temp = dataset.links[i];
            if(temp.source == nodeName || temp.target == nodeName) results.push(temp);
        }
        return results;
    }

    /**
     * Returns the x-coord of this node
     * @param {Array} dataset 
     * @param {String} id 
     */
    var getNodeX = function(dataset, id){
        var d = getNodeByID(dataset, id);
        //get the x coordinate relative to the length of the text
        return (d.index / getTextLength(d.group)) * w;
    }

    /**
     * Returns the y-coord of this node
     * @param {Array} dataset 
     * @param {String} id 
     */
    var getNodeY = function(dataset, id){
        var d = getNodeByID(dataset, id);
        return (d.group != 0) ? 50 : h - 50;
    }

    /**
     * Transforms the match lenght to a relative pixel value
     * compared to the text-lenght on screen
     * @param {Integer} length 
     * @param {Integer} group 
     */
    var getNodeWidth = function(length, group){
        var l = (length / getTextLength(group)) * w;
        //At least return 2, no lower than that
        return Math.max(2, l);
    }

    /**
     * Returns the textlenght for the specified text group
     * @param {Number} group 
     */
    var getTextLength = function(group){
        return textLength[textNames[group]];
    }

    /**
     * Highlights or unhighlights all the links and datanodes that are connected to the provided node
     * @param {Array} dataset 
     * @param {Object} nodeData 
     */
    var highlightMatchPairs = function(dataset,node, nodeData, enabled){
        //Set the values we are setting to the right value depending if we are enabling or disabling
        var opacity = (enabled) ? 1.0 : 0.5;
        var nodeColor = (enabled) ? 'red' : 'green';
        var strokeWidth = (enabled) ? 2.0: 1.0;

        //First set values for the node itself
        d3.select(node).attr('opacity', opacity)
            .classed('selected', enabled);  

        //Get all the links attached to it
        var links = getLinksByNode(dataset, nodeData.id);
        links.forEach(function(link, index){
            //Show the link better
            var linkID = link.source + link.target + "";
            d3.select('[data-id=' + linkID + "]")
                .attr('opacity', opacity)
                .classed('selected', enabled)
                .attr('stroke-width', strokeWidth);

            //Show the other match part better
            d3.select('[data-id=' + linkID.replace(nodeData.id, ''))
                .attr('opacity', opacity)
                .classed('selected', enabled)
        }); 
    }

    /**
     * Holds the public methods for the visualization
     */
    _c.visualization = {

        /**
         * Initializes the visualization. Called on document read
         */
        init: function(){
            //hide the svg
            $('.svg-canvas').hide();
            //save a reference to the svg
            svg = d3.select('.svg-canvas');
        },

        /**
         * This function draws the paralell coords visualization
         * using the provided json Data object
         */
        draw: function(jsonData){
            //Initialize the object that holds the text length
            textLength = {};
            //Copy the jsonData
            var dataset = jsonData;
            //A copy for external use
            comparativus.visualization.data = jsonData;
            //Create a new text-holder group
            var textHolder = svg.append('g').classed('text-holder', true);
            
            //Add the two text rectangles
            textHolder.selectAll('rect')
                        .data(dataset.texts)
                        .enter()
                        .append('rect')
                        .attr('x', 0)
                        .attr('y', function(d, i){return (i > 0) ? h - textMargins.bottom : textMargins.top})
                        .attr('width', w)
                        .attr('height', 30);

            //Show the info about the texts
            textHolder.selectAll('texts')
                        .data(dataset.texts)
                        .enter()
                        .append('text')
                        .classed('textInfo', true)
                        .attr('x', 0)
                        .attr('y', function(d, i){return (i > 0 ) ? h - 5 : 15;})
                        .text(function(d){
                            textLength[d.name] = d.textLength;
                            textNames[d.group] = d.name;
                            return d.name + " : " + d.textLength + " characters";
                        });
            
            //Holder for the text-match nodes
            var nodeHolder = svg.append('g').classed('node-holder', true);

            //Add all the nodes (matches) from the data
            nodeHolder.selectAll('rect')
                        .data(dataset.nodes)
                        .enter()
                        .append('rect')
                        .attr('y', function(d){return (d.group == 0) ? h - 50 : 20;})
                        .attr('x', function(d){return Math.round((d.index / getTextLength(d.group)) * w);})
                        .attr('width', function(d){return getNodeWidth(d.l, d.group)})
                        .attr('height', 30)
                        .attr('opacity', 0.5)
                        .attr('data', function(d){return encodeURI(JSON.stringify(d))})
                        .attr('data-id', function(d){return d.id;})
                        .on('mouseover', function(d){
                            highlightMatchPairs(dataset, this, d, true);  
                        }).on('mouseout', function(d){
                            highlightMatchPairs(dataset, this, d, false);              
                        });    
            
            //Holder of all the links between the nodes
            var linkHolder = svg.append('g').classed('link-holder', true);

            //Add all the links from the data
            linkHolder.selectAll('path')
                        .data(dataset.links)
                        .enter()
                        .append('path')
                        .attr('stroke-width', 1)
                        .attr('opacity', 0.5)
                        .attr('data', function(d){return encodeURI(JSON.stringify(d))})
                        .attr('data-id', function(d){return d.source + d.target})
                        .attr('d', function(d){return getPathDirections(dataset, d.source, d.target);});            
            
            //Fade in the canvas
            $('.svg-canvas').fadeIn(1000);                        
        }
    };
})(comparativus);;/**
 * Anonymous function for this file
 */
(function (_c){
    /**
     * The popover object that will hold all the methods
     */
    _c.popover = {
        /**
         * Holds a JQ ref to the element of the popover in the DOM
         */
        pop: {},
        /**
         * Initializes the popover module
         */
        init: function(){
            comparativus.popover.pop = $('#popover');
        },

        /**
         * Shows the content that is supplied as a parameter as the
         * content of the popover div. The content should be HTML string
         * @param content {String}  HTML content as string
         * @param top   {Number}    the top coordinate (y coordinate)
         * @param left  {Number}    the left coordinate (x coordinate)
         */
        show: function(content, top, left){
            var coords = {'top': top, 'left': left};
            comparativus.popover.pop.offset(coords);
            comparativus.popover.pop.html(content);
            comparativus.popover.pop.fadeIn();
            $(document).click(function(){
                comparativus.popover.pop.hide();
                //$(document).unbind('click');
            });
            
        },

        /**
         * Hides the popover. Does NOT empty it. 
         */
        hide: function(){
            comparativus.popover.pop.fadeOut();
        },

        /**
         * Shows the JSON data that is attached to the provided element.
         * @param element {HTMLElement} the element that has a 'data' attribute that contains JSON
         */
        showData: function(element){
            var node = JSON.parse($(element).attr('data'));
            var match = node.match;
            var html = "<h4>Match Data</h4>\n" +
            "<b>Match A: </b>" + match.textA + "<br>" +
            "<b>Match B: </b>" + match.textB + "<br>" + 
            "<b>Ratio: </b> " + match.r + "<br>" +
            "<b>Length: </b>" + match.l;
            var offset = $(element).offset();
            comparativus.popover.show(html, offset.top + $(element).height(), offset.left);
        }
    };
})(comparativus);;/**
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