/**
This file contains some functions to control the GUI elements. These are shorthand functions and
control the view
**/

function setComparisonButtonText(text){
  $('#comparisonButtonText').html(text);
}

/**
Shows the loading animation (parameter turns on or off)
**/
function showLoadingAnimation(enabled){
  if(enabled){
    $('#comparisonButtonIcon').removeClass().addClass('glyphicon glyphicon-repeat rotating');
  }else{
    $('#comparisonButtonIcon').removeClass().addClass('glyphicon glyphicon-refresh');
  }
}

/**
Shakes the file input with the provided name
**/
function shakeFileInput(name){
  name = name.toUpperCase();
  $('#panel' + name).addClass('animated jello');
  $('#panel' + name).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
    $('#panel' + name).removeClass('animated jello')
  });
}

/**
Returns the file name of the provided text (a, b or c)
**/
function getFileName(name){
  return $('#panel' + name.toUpperCase()).find('.fileName').html().replace(/\.[^/.]+$/, "");
}

/**
Returns the minimumMatchSize
**/
function getMinMatchSize(){
  return Math.round(Number($('#minimumMatchSize').val()));
}

/**
Sets the similirity value span to the provided value
**/
function setSimilarityScore(val){
  $('#simScore').html(val);
}

/**
Shows the result table.
**/
function showResultTable(matches){
  //now show all matches in the browser
  var parts = [];
  parts.push("<thead><tr><th>IndexA</th><th>IndexB</th><th>Length</th><th>Likeness</th><th>TextA</th><th>TextB</th></tr></thead><tbody>");
  var tsvParts = [];
  var cMatch; var max = matches.length;
  $('#matchesAmt').html(max);
  for(var i = 0; i < max; i++){
    cMatch = matches[i];
    parts.push("<tr><td><a class='matchLink' href='#match-" + i + 'a' + "'>" + cMatch.indexA +
    "</a></td><td><a class='matchLink' href='#match-" + i + 'b' + "'>" + cMatch.indexB +
    "</td><td>" + cMatch.l + "</td><td> " + cMatch.r  + "</td><td>" + cMatch.textA + "</td><td>"
    + cMatch.textB + "</td></tr>");
    tsvParts.push(cMatch.indexA + '\t' + cMatch.indexB + '\t' + cMatch.l + '\t' + cMatch.r + '\t' + cMatch.textA + '\t' + cMatch.textB);
  }
  $("#resultTable").html(parts.join() + "</tbody>");

  //create the downloadButtons
  $('#downloadTSVButton').click(function(){createTSVFile(tsvParts);});
  $('#downloadJSONButton').click(function(){createJSONFile(matches);});
}

/**
Sets the file panel with the provided name to the provided content
**/
function setFilePanelContent(name, content){
  $('#text' + name.toUpperCase()).html(content);
}

/**
Checks the minimumMatchSize value. This should be a valid integer.
**/
function checkMinMatchSize(el){
  el.value = Math.round(Number(el.value));
  if(el.value == 0) el.value = 10;
}

/**
Reads a single file into memory
**/
function readSingleFile(e, name) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  $(e.target.parentNode).find('.fileName').html('Loading...');

  var reader = new FileReader();
  reader.onload = function(e) {
    $('#' + 'text' + name.toUpperCase()).html(e.target.result);
    $('#' + 'info' + name.toUpperCase()).html('Length: ' + e.target.result.length + ' characters');
    $($('#fInput' + name.toUpperCase()).get(0).parentNode).find('.fileName').html(file.name);
  };

  reader.readAsText(file);
}

/**
Called when the mouse enters the matching html element
**/
function onMatchMouseOver(matchElement){
  var letter = (matchElement.id.indexOf('b') == -1) ? 'b' : 'a';
  var aID = matchElement.id;
  var bID = matchElement.id.substr(0, matchElement.id.length - 1) + letter;
  window.location.hash = "#" + bID;
  $('#' + aID).addClass('matchHighlight');
  $('#' + bID).addClass('matchHighlight');
}

/**
Called when the mouse leaves the matching html element
**/
function onMatchMouseOut(matchElement){
  var letter = (matchElement.id.indexOf('b') == -1) ? 'b' : 'a';
  var aID = matchElement.id;
  var bID = matchElement.id.substr(0, matchElement.id.length - 1) + letter;
  $('#' + aID).removeClass('matchHighlight');
  $('#' + bID).removeClass('matchHighlight');
}

document.getElementById('fInputA').addEventListener('change', function(e){readSingleFile(e, 'a')}, false);
document.getElementById('fInputB').addEventListener('change', function(e){readSingleFile(e, 'b')}, false);

//set popover to have with relative to the main body
$('[data-toggle="popover"]').popover({
    container: 'body'
});
//activate popovers
$('[data-toggle="popover"]').popover();
