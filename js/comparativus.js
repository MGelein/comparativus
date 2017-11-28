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
        comparativus.worker.decorateText(idA, comparativus.nodes.a, comparativus.edits[idA]);
        comparativus.worker.decorateText(idB, comparativus.nodes.b, comparativus.edits[idB]);
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
        var tA = comparativus.text.getByID(idA);
        var tB = comparativus.text.getByID(idB);
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
            comparativus.matches.push(m);
            comparativus.addNodeFromMatch(m);
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
    
})(comparativus);