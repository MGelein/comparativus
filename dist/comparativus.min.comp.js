"use strict";

/**
 * This is the main global comparativus object. This is used
 * to hide all methods, objects and variables from the global 
 * namespace to prevent polluting it.
 */
var comparativus = {
    build: '2.1.1',
    author: "Mees Gelein"
};

(function(_c){
    /**
     * The minimum lenght a match should be to be added to the results.
     * This read either from the URL Get variables, or parsed from the UI
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
     * Called to start the comparison between the two texts. This
     */
    _c.startComparison = function(){
        comparativus.ui.setComparisonButtonText('Running Comparison');
        comparativus.minMatchLength = comparativus.ui.getMinMatchSize();

        comparativus.matches = [];
        comparativus.nodes = {
            a: [],
            b: []
        }

        var ids = comparativus.text.getAllIDs();
        //Run comparison on the first two, this should change based on the amount of texts
        comparativus.runSingleComparison(ids[0], ids[1]);
    }

    /**
     * Runs the comparison between a single set of texts signified by their
     * two ids that have been provided below.
     */
    _c.runSingleComparison = function(idA, idB){
        var dictA = comparativus.dicts[idA];
        var dictB = comparativus.dicts[idB];
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
                comparativus.expandAllMatches(dictA[seeds[i]], dictB[seeds[i]], idA, idB);
            }
        }
        //also add all seeds of text B to the total amount of seeds
        seeds = Object.keys(dictB);
        seedAmt = seeds.length;
        for(var i = 0; i < seedAmt; i++){
        totalSeedAmt += dictB[seeds[i]].length;
        }
        //console.log('Total seed Amt: ' + totalSeedAmt + ' and overlap seed Amt: ' + overlapSeedAmt + " > Similarity Score: " + overlapSeedAmt / totalSeedAmt);
        comparativus.ui.setSimilarityScore(overlapSeedAmt / totalSeedAmt);
        comparativus.ui.showResultTable(comparativus.matches);
        comparativus.text.toDecorate = 2;
        comparativus.ui.setComparisonButtonText('Creating Text Decoration (' + comparativus.text.toDecorate + ' left)');
        comparativus.text.decorate(idA, comparativus.nodes.a);
        comparativus.text.decorate(idB, comparativus.nodes.b);

        //Show that we're done
        comparativus.ui.setComparisonButtonText('Creating Text Decoration (' + comparativus.text.toDecorate + ' left)');
        comparativus.ui.setComparisonButtonText('(Re)Compare Texts');
        comparativus.ui.showLoadingAnimation(false);
        //Re-add listeners now that we're done with the comparison
        comparativus.ui.init();
        
    };

    /**
     * Expands a single match from two indeces
     * @param {Integer} iA 
     * @param {Integer} iB 
     */
    var expandMatch = function(iA, iB, idA, idB){
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

        //Start at a predetermined size of 10, then expand or diminish to fit
        var matchLength = 10;
        var tA = comparativus.text.getByID(idA).plain;
        var tB = comparativus.text.getByID(idB).plain;
        var sA = tA.substr(iA, matchLength);
        var sB = tB.substr(iB, matchLength);
        var strikes = 0;

        //diminish to the left (if the 10 char expansion made the levDist to low)
        while(comparativus.util.levDistRatio(sA, sB) < 0.8 && matchLength > 0){
            matchLength --;
            sA = tA.substr(iA, matchLength);
            sB = tB.substr(iB, matchLength);
        }

        //expand right
        while(strikes < 3){
            if(comparativus.util.levDistRatio(sA, sB) < 0.8){
                strikes ++;
            }else{
                strikes = 0;
            }
            matchLength++;
            sA = tA.substr(iA, matchLength);
            sB = tB.substr(iB, matchLength);
            //Build a fail safe in case one of the indeces overflows the text length
            if(iA + matchLength > tA.length || iB + matchLength > tB.length) break;
        }
        //take off the three chars we added to much.
        matchLength -= 3;
        strikes = 0;
        sA = tA.substr(iA, matchLength);
        sB = tB.substr(iB, matchLength);

        //expand left
        while(strikes < 3){
            if(comparativus.util.levDistRatio(sA, sB) < 0.8){
                strikes ++;
            }else{
                strikes = 0;
            }
            //By increasing lenght and decreasing index we're basically expanding left
            matchLength++;
            iA --;
            iB --;
            if(iA < 0 || iB < 0){
                iA = iB = 0;
                break;
            }
            sA = tA.substr(iA, matchLength);
            sB = tB.substr(iB, matchLength);
        }
        //return the three chars we add too much
        iA += strikes; iB += strikes;
        matchLength -= strikes;
        sA = tA.substr(iA, matchLength);
        sB = tB.substr(iB, matchLength);

        //now it has been fully expanded. Add it to the matches object if the length
        //is greater than minLength
        if(matchLength >= comparativus.minMatchLength){
            var m = {l:matchLength, indexA:iA, indexB:iB, textA:sA, textB:sB, r:comparativus.util.levDistRatio(sA, sB)};
            m.urnA = comparativus.urn.fromMatch(tA, m.indexA, m.l);
            m.urnB = comparativus.urn.fromMatch(tB, m.indexB, m.l);
            comparativus.matches.push(m);
            comparativus.addNodeFromMatch(m);
        }
    }

    /**
     * Adds new nodes to the list of them. 
     * @param {Match} match 
     */
    _c.addNodeFromMatch= function(match){
        var nA = {index: match.indexA, urn: match.urnA, 'match': match};
        var nB = {index: match.indexB, urn: match.urnB, 'match': match};
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
    }


    /**
     * Expands all occurrences for a matching seed found in the dictionary
     */
    _c.expandAllMatches = function(occA, occB, idA, idB){
        var maxA = occA.length;
        var maxB = occB.length;
        var matchAIndex;
        var matchBIndex;
        for(var i = 0; i < maxA; i++){
            matchAIndex = occA[i];
            for(var j = 0; j < maxB; j++){
                matchBIndex = occB[j];
                expandMatch(matchAIndex, matchBIndex, idA, idB);
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
         * means they are completely different.
         * 
         * This is basically the normalized levensthein distance.
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
        },

        /**
         * Checks if we're running under a localhost environment
         * @returns {boolean}
         */
        isDebug: function(){
            return (window.location.href.indexOf('localhost') != -1);
        }
    };
})(comparativus);
/**
 * Determines a very useful String.insertAt function. This is a prototype overwrite,
 * but that should be okay in this case. 
 * 
 * @param {Integer} index this is the position you want to inser at
 * @param {String} string the string you want to insert into the string
 */
String.prototype.insertAt = function(index, string){
    //First check if we're inserting at the beginning or the end, this prevents unnecessary function calls
    if(index <= 0){
        return string + this;
    }else if(index => this.length){
        return this + string;
    }else{
        //According to https://gist.github.com/najlepsiwebdesigner/4966627 this is a neccesary fix
        if(string.charCodeAt(0) == 13){
            string = "\n";
        }
            
        //Return the compiled string
        return this.substring(0, index) + string + this.substring(index, this.length);
    }
};/**
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
        prepareText: function(id){
            var config = {
              'stripWhiteSpace': $('#stripWhiteSpace').val(),
              'stripPunctuation': $('#stripPunctuation').val()
            };
            message('prepareText', {'id': id, 'text': comparativus.text.getByID(id).data, 'config': config});          
        },

        /**
         * Messages the worker to start building the dictionary.
         * Builds the dictionary for the text that is registered under
         * the provided name
         */
        buildDictionary: function(id){
            message('buildDictionary', {'id':id , text: comparativus.text.getByID(id).plain});
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
                    comparativus.dicts[params.id] = params.dictionary;
                    if(comparativus.dicts.toBuild == 0){
                        comparativus.startComparison();
                    }
                    break;
                case 'PrepareDone':
                    comparativus.text.setByID(params.id, params.text);
                    $('#info' + params.id).html('Length: ' + params.text.length + ' characters');
                    comparativus.ui.setComparisonButtonText('Building dictionaries...');
                    comparativus.worker.buildDictionary(params.id);
                    break;
            }
          }
    };
           
})(comparativus);;/**
 * Anonymous namespace of this file to prevent polluting of the global namespace
 */
(function(_c){

    _c.ui = {
        /**
         * Holds the HTML for a single matchmark
         */
        matchmark: "",

        /**
         * This function adds the event listeners to the ui objects
         * and inputs. Basically, all the initialization of the UI
         */
        init: function(){
            //Handler for the comparisonButton
            $('#comparisonButton').unbind('click').click(function(){
                //unbinds the click handler, to prevent more clicking during comparison
                $(this).unbind('click');
            
                comparativus.dicts.toBuild = comparativus.text.amt();
                comparativus.ui.setComparisonButtonText('Preparing texts for comparison...');
                comparativus.ui.showLoadingAnimation(true);
                comparativus.text.prepareAll();
            });

            //set popover to have with relative to the main body
            $('[data-toggle="popover"]').unbind('popover').popover({
                container: 'body'
            });
            //activate popovers
            $('[data-toggle="popover"]').unbind('popover').popover(); 

            //Load the matchmark template
            $.get('./parts/matchmark.html', function(data){
                comparativus.ui.matchmark = data;
            });
        },

        /**
         * Returns the opening or closing matchmark of a match (dependent on the 
         * state of the passed parameter boolean)
         * @param {Boolean} opening if true, this is a astart of a match, if false it is the end
         * @param {String} urnID    the id+urn of this match and text.
         */
        getMatchMark: function(opening, urnID){
            var openingClass = "glyphicon glyphicon-chevron-left";
            var closingClass = "glyphicon glyphicon-chevron-right"
            var mark = comparativus.ui.matchmark.replace(/%MARK%/g, ((opening) ? openingClass : closingClass));
            return mark.replace(/%URN%/g, urnID);
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
        setFilePanelContent: function(id, content){
            $('#text' + id).html(content);
        },

        /**
         * Loads a new file into a newly created tab of the textContent div.
         */
        addFileTab: function(id, name, content){
            //Add the tab
            $.get('./parts/filetab.html', function(data){
                //Activate the template
                data = data.replace(/%ID%/g, id);
                data = data.replace(/%NAME%/g, name);
                $('#navTabs').append(data);
                //If this is the first one, make it active
                if($('#navTabs li').length == 1){
                    $('#navTabs li').addClass('active');
                }
            });
            //Add the div that holds the pre that holds the text
            $.get('./parts/textholder.html', function(data){
                //First activate the template by replacing KEYwords
                data = data.replace(/%ID%/g, id);
                data = data.replace(/%CONTENT%/g, content);
                $('#textContent').append(data);
                //If this is the first one, make it active
                if($('#textContent div').length == 1){
                    $('#textContent div').addClass('in active');
                }
            });
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
            //Stringbuilder that will hold the HTML for the data table
            var parts = [];

            //Add the table header
            parts.push("<thead><tr><th>IndexA</th><th>IndexB</th><th>Length</th><th>TextA</th><th>TextB</th></tr></thead><tbody>");
            
            //Stringbuilder for the parts of a TSV file
            var tsvParts = [];
            
            //Set the amt of results in the table
            $('#matchesAmt').html(matches.length);
            
            //Loop through every match
            matches.forEach(function(cMatch){
                //Get the link id
                var linkID = 'A' + cMatch.indexA + 'B' + cMatch.indexB;
                //Add a new line for that match
                parts.push("<tr id='row" + linkID +"'><td><a class='matchLink'>" + cMatch.urnA +
                "</a></td><td><a class='matchLink'>" + cMatch.urnB +
                "</td><td>" + cMatch.l + "</td><td>" + cMatch.textA + "</td><td>"
                + cMatch.textB + "</td></tr>");

                //And a new line for its TSV counter part
                tsvParts.push(cMatch.indexA + '\t' + cMatch.indexB + '\t' + cMatch.l + '\t' + cMatch.r + '\t' + cMatch.textA + '\t' + cMatch.textB);
            });

            //Add the result to the page
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
            $('#' + 'text' + name.toUpperCase()).html(text);
            $('#' + 'info' + name.toUpperCase()).html('Length: ' + text.length + ' characters');
            $('#info' + name.toUpperCase()).parent().find('.fileName').html(filename);
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
            jsonFile.texts = comparativus.text.getJSON();
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
    var textNames = [];
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
 * Anonymous namespace of this file to prevent polluting of the global namespace
 */
(function(_c){
    /**
     * The URN object holds the necessary methods for converting index to 
     * urn's and back again.
     */
    _c.urn = {
        /**
         * Returns a urn object that signifies what character
         * this index was at. I.e. a[5] is the sixth 'a'.
         * 
         * @param {String} text The text in which the index is
         * @param {Integer} index   The index in the aforementioned text.
         */
        fromIndex: function(text, index){
            //What character are we trying to find
            var c = text.charAt(index);

            //What is the first occurence
            var cIndex = text.indexOf(c);
            var found = 0;

            //Keep looking for matching character untill we arrive at the specified index
            while(cIndex != index){
                found ++;
                cIndex = text.indexOf(c, cIndex + 1);
            }

            //When it exits the loop, we have found a result, return it
            return c + '[' + found + ']';
        },

        /**
         * Tries to find the index of the character signified by the 
         * provided urn paramter in the provided text. This ignores
         * any characters between `<` and `>` brackets as they are part
         * of the HTML layout.
         * 
         * @param {String} text the text the urn is reffering to
         * @param {String} urn  the referrence to a character
         */
        toIndex: function(text, urn){
            //First decode the character and number of the urn
            var c = urn.substring(0, 1);
            var n = parseInt(urn.substr(2, urn.length - 3));

            //Then try to find that occurence
            var cIndex = -1, found = -1, ltIndex, gtIndex;
            do{
                //First find an occurence
                cIndex = text.indexOf(c, cIndex + 1);
                //Then check preceding '<' and '>'
                ltIndex = text.lastIndexOf('<', cIndex);
                gtIndex = text.lastIndexOf('>', cIndex);
                //Only count this instance if it was not within brackets
                if(ltIndex <= gtIndex) found++;
            }while(found != n);

            //Now that we have found it, return the index
            return cIndex;
        },

        /**
         * Converts a passed range of indeces in a provided text to 
         * a URN string that can be converted back.
         * 
         * @param {String} text The text the indeces refer to
         * @param {Integer} sIndex the start of the passage we are indexing
         * @param {Integer} eIndex the end of the passage we are indexing (exclusive)
         */
        fromIndeces: function(text, sIndex, eIndex){
            return comparativus.urn.fromIndex(text, sIndex) + "-" + comparativus.urn.fromIndex(text, eIndex);
        },

        /**
         * Tries to parse a URN as a range for the provided text. Returns
         * the range as an array of two index numbers. index[0] is the first
         * index number (integer), index[1] is the second index number.
         * 
         * @param {String} text The text the urn refers to
         * @param {String} urn the urn that we're converting
         */
        toIndeces: function(text, urn){
            return [
                comparativus.urn.toIndex(text, urn.substring(0, urn.indexOf('-', 2))), //Do this substring thing instead of split because of hyphen as a URN character
                comparativus.urn.toIndex(text, urn.substring(urn.indexOf('-', 2) + 1)) //This allows us to also refer to a hyphen as a URN not just a range character
            ];
        },

        /**
         * Converts a passed match to a URN string that can whitstand the 
         * altering of the text structure in HTML.
         * 
         * @param {String} text The text the match refers to
         * @param {Integer} index the start index of this match
         * @param {Integer} length the length of this match
         */
        fromMatch: function(text, index, length){
            return comparativus.urn.fromIndeces(text, index, index + length);
        },

        /**
         * Converts a URN text range to a match object that has a
         * length and index property. Use result.length and result.index
         * to read these. Also contains a text property (result.text)
         * that contains the referenced substring match.
         * 
         * @param {String} text the text the URN refers to
         * @param {String} urn  the URN we're trying to decode
         */
        toMatch: function(text, urn){
            var indeces = comparativus.urn.toIndeces(text, urn);
            //Then construct a match object from it.
            return {
                index: indeces[0],
                length: indeces[1] - indeces[0],
                text: text.substring(indeces[0], indeces[1])
            };
        }
    };
})(comparativus);;/**
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
})(comparativus);;/**
Starts after document load.
**/
$(document).ready(function (){
    //Start loading all modules
    initModules();

    //Based on the debug variable, decide where we load the list of files from
    var listFilesURL = "http://dh.chinese-empires.eu/auth/list_files/";
    if(comparativus.util.isDebug()) listFilesURL = "./data/list_files.json";
    
    //Then load the list files from the right location
    $.get(listFilesURL, function(data){  
        //Assign the file list
        comparativus.file.list = data;
        //Only start initializing after we've received the file list from the server
        initFiles();
    });
        
});

/**
 * Calls initializing functions for the modules that require them. This happens before
 * the loading of any AJAX calls and therefore should not require the presence of 
 * files likes 'list_files' in comparativus.file.list
 */
function initModules(){
    //Call the init function for modules that need it
    comparativus.worker.init();   
    comparativus.ui.init();
    comparativus.visualization.init();
    comparativus.popover.init();
}

/**
 * Calls the necessary functions to, depending on environment (production / dev), 
 * load either some dev data files or to actually parse the user input in the GET
 * variables. Called after ajax calls like list_files have succeeded. 
 */
function initFiles(){ 
    if(!comparativus.util.isDebug()){
        //Load the files from the GET URL variables
        var files = comparativus.util.getURLVar('files');
        files.split(',').forEach(function(id){
            comparativus.file.loadFromID(id, function(data){
                comparativus.text.add(id, comparativus.file.getTitleFromID(id), data);
            });
        });
    }else{
        //Load the data files from disc
        $.ajax('data/Mencius.txt', {success:function(data){
            var idA = '5a15793ed272f335aab275af'
            comparativus.text.add(idA, comparativus.file.getTitleFromID(idA), data);
        }});
        $.ajax('data/ZGZY.txt', {success:function(data){
            var idB = '5a1579a3d272f335aab275b0';
            comparativus.text.add(idB, comparativus.file.getTitleFromID(idB), data);
        }});
    }   
}