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
        console.log('Total seed Amt: ' + totalSeedAmt + ' and overlap seed Amt: ' + overlapSeedAmt + " > Similarity Score: " + overlapSeedAmt / totalSeedAmt);
        comparativus.ui.setSimilarityScore(overlapSeedAmt / totalSeedAmt)
        comparativus.ui.showResultTable(comparativus.matches);
        comparativus.texts.toDecorate = 2;
        comparativus.ui.setComparisonButtonText('Creating Text Decoration (' + comparativus.texts.toDecorate + ' left)');
        comparativus.worker.decorateText('a', comparativus.matches, comparativus.edits['a']);
        comparativus.worker.decorateText('b', comparativus.matches, comparativus.edits['b']);
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
            //console.log("Match found: " + m.l);
        }
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
    
})(comparativus);