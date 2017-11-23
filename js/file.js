/**
 * Anonymous namespace for this file
 */
(function(_c){
    /**
     * All the file and data manipulation methods
     */
    _c.file = {
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
         * @param {String} id   the id used for the file in the filesystem
         * @param {Function} callback   takes the file data as a parameter
         */
        loadFromID: function(id, callback){
            $.get("http://dh.chinese-empires.eu/auth/get/" + id, function(data){
                callback($(data).text());
            });
        },

        /**
         * 
         * @param {String} text the text to put into the textfield 
         * @param {String} name the name of the text field [a-b]
         */
        populateFileHolder: function(text, name, filename){
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
})(comparativus);