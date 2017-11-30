/**
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

            //Assign the page button event handler
            $('.btn-page').click(comparativus.ui.switchPage);

            //Forward the call to show the settings menu
            $('#settingsButton').click(comparativus.ui.showSettingsMenu);
        },

        /**
         * Shows the settings menu and binds listeners where necessary
         */
        showSettingsMenu: function(event){
            var sh = $('#settingsHolder');
            var et = $(event.target);
            //in case we click the cog
            if(et.attr('id') != "settingsButton") et = et.parent();
            //Start fading it in to make calculations possible using the dimensions of this object
            sh.fadeIn();
            var pos = {
                top: et.offset().top + et.outerHeight() + 2,
                left: et.offset().left - sh.width() + et.outerWidth()
            }
            sh.offset(pos);
            //Now unbind the show action and bind the hide action
            et.unbind('click').click(comparativus.ui.hideSettingsMenu);
            et.parent().addClass('active');
        },

        /**
         * Called to hide the menu again
         */
        hideSettingsMenu: function(event){
            var sh = $('#settingsHolder');
            var et = $(event.target);
            //in case we click the cog
            if(et.attr('id') != "settingsButton") et = et.parent();
            //Fade out the settings holder
            sh.fadeOut(400, function(){sh.offset({top: 0, left: 0})});
            //Don't make the button active anymore
            et.parent().removeClass('active');
            //Rebind the show action
            et.unbind('click').click(comparativus.ui.showSettingsMenu);
        },

        /**
         * Called when a user clicks on one of the page buttons to switch to a different page
         */
        switchPage: function(event){
            //Set the clicked page as the active page
            $('.btn-page').removeClass('active');
            //Set it as active and de-focus asap
            $(event.target).addClass('active').blur();

            //Find the id of the page we're trying to load and the old page
            var newPage = $('#' + $(event.target).text().toLowerCase() + "Page");
            var oldPage = $('.page.active');

            //check if we're not staying on the same page, if so cancel
            if(newPage.attr('id') == oldPage.attr('id')) return;

            //Fade out the old page
            oldPage.removeClass('active').fadeOut();
            newPage.addClass('active').fadeIn();
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
})(comparativus);