//Reference to the threads
var thread;
//Data object that holds all the texts
var texts = {};
//The object that holds the dictionaries of the texts
var dicts = {};
//The object that holds all the edits for the texts
var edits = {};
//All the matches that have been found
var matches = [];
//The minimum length of the match
var minMatchLength = 10;
//Flag if we are currently running
var RUNNING = 0;

/**
Starts after document load.
**/
$(document).ready(function (){
  //create a new thread
  thread = new Worker('js/thread.js?v=10');
  thread.onmessage = function(event){
    //it is assumed that any communication from a worker assigns these values
    var action = event.data.action;
    var params = event.data.params;

    //Switch based on the action parameter
    switch(action){
      case 'DictDone':
        dicts.toBuild --;
        dicts[params.textName] = params.dictionary;
        if(dicts.toBuild == 0){
          console.log('Starting Comparison');
          startComparison();
        }
      break;
      case 'DecorateDone':
        texts.toDecorate --;
        setFilePanelContent(params.textName, params.result);
        setComparisonButtonText('Creating Text Decoration (' + texts.toDecorate + ' left)');
        if(texts.toDecorate == 0){
          setComparisonButtonText('(Re)Compare Texts');
          showLoadingAnimation(false);
          RUNNING = 0;
        }
      break;
      case 'PrepareDone':
        texts[params.textName] = params.text;
        edits[params.textName] = params.edits;
        $('#info' + name.toUpperCase()).html('Length: ' + texts[params.textName].length + ' characters');
        $('#text' + name.toUpperCase()).html(params.text);
        setComparisonButtonText('Building dictionaries...');
        buildDictionary(params.textName);
      break;
    }
  }
  addUIListeners();
});

/**
Add the listeners to the UI
**/
function addUIListeners(){
  $('#comparisonButton').click(function(){
    console.log("Asked to start");
    if(RUNNING > 0) return;
    var aEmpty = ($('#textA').html() == "" );
    var bEmpty = ($('#textB').html() == "" );
    if(aEmpty) shakeFileInput('a');
    if(bEmpty) shakeFileInput('b');
    if(aEmpty || bEmpty) return;

    dicts.toBuild = 2;
    RUNNING = 1;
    setComparisonButtonText('Preparing texts for comparison...');
    showLoadingAnimation(true);
    loadDataFile('a', $('#textA').html());
    loadDataFile('b', $('#textB').html());

  });
}

/**
Starts the comparison between the two texts
**/
function startComparison(){
  setComparisonButtonText('Running Comparison');
  minMatchLength = getMinMatchSize();

  matches = [];
  var dictA = dicts['a'];
  var dictB = dicts['b'];
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
      expandMatches(dictA[seeds[i]], dictB[seeds[i]]);
    }
  }
  //also add all seeds of text B to the total amount of seeds
  seeds = Object.keys(dictB);
  seedAmt = seeds.length;
  for(var i = 0; i < seedAmt; i++){
    totalSeedAmt += dictB[seeds[i]].length;
  }
  console.log('Total seed Amt: ' + totalSeedAmt + ' and overlap seed Amt: ' + overlapSeedAmt + " > Similarity Score: " + overlapSeedAmt / totalSeedAmt);
  setSimilarityScore(overlapSeedAmt / totalSeedAmt)
  showResultTable(matches);
  texts.toDecorate = 2;
  setComparisonButtonText('Creating Text Decoration (' + texts.toDecorate + ' left)');
  decorateText('a', matches, edits['a']);
  decorateText('b', matches, edits['b']);
}

/**
Expand the matching seeds
**/
function expandMatches(occA, occB){
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
}

/**
Expands a single match from two indeces
**/
function expandMatch(iA, iB){
  //first check if this match is inside another match
  var max = matches.length;
  var cMatch;
  for(var i = 0; i < max; i++){
    cMatch = matches[i];
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
  var sA = texts.a.substr(iA, matchLength);
  var sB = texts.b.substr(iB, matchLength);
  var strikes = 0;

  //diminish to the left (if the 10 char expansion made the levDist to low)
  while(levDistRatio(sA, sB) < 0.8 && matchLength > 0){
    matchLength --;
    sA = texts.a.substr(iA, matchLength);
    sB = texts.b.substr(iB, matchLength);
  }

  //expand right
  while(strikes < 3){
    if(levDistRatio(sA, sB) < 0.8){
      strikes ++;
    }else{
      strikes = 0;
    }
    matchLength++;
    sA = texts.a.substr(iA, matchLength);
    sB = texts.b.substr(iB, matchLength);
    if(iA + matchLength > texts.a.length || iB + matchLength > texts.b.length) break;
  }
  //take off the three chars we added to much.
  matchLength -= 3;
  strikes = 0;
  sA = texts.a.substr(iA, matchLength);
  sB = texts.b.substr(iB, matchLength);

  //expand left
  while(strikes < 3){
    if(levDistRatio(sA, sB) < 0.8){
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
    sA = texts.a.substr(iA, matchLength);
    sB = texts.b.substr(iB, matchLength);
  }
  //return the three chars we add too much
  iA += strikes; iB += strikes;
  matchLength -= strikes;
  sA = texts.a.substr(iA, matchLength);
  sB = texts.b.substr(iB, matchLength);

  //now it has been fully expanded. Add it to the matches object if the length
  //is greater than minLength
  if(matchLength >= minMatchLength){
    var m = {l:matchLength, indexA:iA, indexB:iB, textA:sA, textB:sB, r:levDistRatio(sA, sB)};
    matches.push(m);
    //console.log("Match found: " + m.l);
  }
}

/**
Returns the levDistance ratio [0-1] between the two provided Strings
**/
function levDistRatio(sA, sB){
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
}

/**
Makes sure the messages are always nicely formatted according to my expectations
meaning: always define an action and params.
**/
function message(action, parameters){
  thread.postMessage({'action' : action, 'params' : parameters});
}

/**
This function loads data files from the disk. Just used for testing purposes.
If the file is already loaded. Don't clean it again
*/
function loadDataFile(name, data){
  console.log('Loading Data file: ' + name);
  var config = {
    'stripWhiteSpace': $('#stripWhiteSpace').val(),
    'stripPunctuation': $('#stripPunctuation').val()
  };
  message('prepareText', {'textName': name, 'text': data, 'config': config});
}

/**
Builds the dictionary for the text that is registerd under the provided name
**/
function buildDictionary(name){
  console.log('Message to start Building Dict for: ' + name);
  message('buildDictionary', {textName:name, text: texts[name]});
}

/**
Decorates the text (shows the matches in the text)
**/
function decorateText(name, matches, edits){
  message('decorateText', {textName:name, text: texts[name], match:matches, 'edits': edits});
}
