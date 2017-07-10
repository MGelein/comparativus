/**BLAST seed size*/
var K = 4;

/**
Called when messaged by the main thread
**/
self.onmessage = function(event){
  //it is assumed that any communication from a worker assigns these values
  var action = event.data.action;
  var params = event.data.params;

  //Switch based on the action
  switch(action){
    case 'buildDictionary':
      buildDictionary(params.textName, params.text);
    break;
    case 'decorateText':
      decorateText(params.textName, params.text, params.match, params.edits);
    break;
    case 'prepareText':
      prepareText(params.textName, params.text, params.config);
      break;
  }
}

/**
This function prepares the text data for comparison by removing whitespace and/
or punctuation according to the config object. It does this non destructively
by keeping track of where characters are removed so they can be re-added on a
later date.
**/
function prepareText(name, text, config){
  console.log('preparing text for use: ' + name);
  //an array that will keep track of edit objects
  var edits = [];
  var result;
  var chars;
  //first try to strip all whitespace
  if(config.stripWhiteSpace){
    chars = [' ', '\t', '\n', '\r'];
    result = removeAndKeepTrack(text, edits, chars);
    edits = result.edits;
    text = result.text;
    //text = text.replace(/\s/g,'');
  }
  //then try to strip all punctuation
  if(config.stripPunctuation){
    chars = ['。', '』', '」', '，', '《', '》', '：', '『', '？', '「', '；'];
    result = removeAndKeepTrack(text, edits, chars);
    edits = result.edits;
    text = result.text;
    //text = text.replace(/。|』|」|，|《|》|：|『|？|「|；/g, '');
  }
  //console.log('Performed ' + edits.length + ' edits on text ' + name);
  //now send the result back to the main thread
  message('PrepareDone', {'textName':name, 'text':text, 'edits': edits});
}

/**
This function removes the specified characters and keeps track of where
and what was removed
**/
function removeAndKeepTrack(text, edits, chars){
  var charNum = chars.length;
  var charIndex; var i; var result;
  for(i = 0; i < charNum; i++){
    result = removeAndKeepTrackOfChar(text, edits, chars[i]);
    text = result.text;
    edits = result.edits;
  }
  //return the result and modified text in this result object
  return {'text': text, 'edits': edits};
}

/**
Remoes and keep track of one type of character
**/
function removeAndKeepTrackOfChar(text, edits, c){
  //keep going untill all characters of this type have gone
  while(text.indexOf(c) != -1){
    edits.push({
      'index': text.indexOf(c),
      'character': c
    });
    //remove char
    text = text.replace(c, '');
  }
  return {'text': text, 'edits': edits};
}

/**
Decorates the text and once it is done returns the result
**/
function decorateText(name, text, matches, edits){
  var parts = [];
  var max = matches.length;
  var m;
  var getA = (name == 'a');
  var startIndex = 0;
  var endIndex = 0;
  var lastIndex = 0;

  //sort the array based on the indeces
  if(getA){
    matches.sort(function(a, b){
      b.indexA - a.indexA;
    });
  }else{
    matches.sort(function(a, b){
      b.indexB - a.indexB;
    });
  }
  for(var i = 0 ; i < max; i++){
    m = matches[i];
    if(getA) startIndex = m.indexA;
    else startIndex = m.indexB;
    endIndex = startIndex + m.l;
    parts.push(text.substring(lastIndex, startIndex));
    parts.push(text.substring(startIndex, endIndex));
    lastIndex = endIndex;
  }
  max = parts.length;
  //add back the trailing bit to the end of the text after the last match
  parts.push(text.substring(lastIndex, text.length - 1));
  //undo all the edits that have been done
  parts = undoEdit(parts, edits);
  var matchID = 0;
  //array to add all the bits to. Makes it faster then string concatenation
  var bits = [];
  for(var i = 0; i < max; i+=2){
    bits.push(parts[i] + "<span id='match-" + matchID + name + "' class='matchSpan' onmouseover='onMatchMouseOver(this)' onmouseout='onMatchMouseOut(this)'>");
    matchID ++;
    bits.push(parts[i + 1] + "</span>");
  }
  //rebuild the text
  message('DecorateDone', {'textName':name, 'result':bits.join()});
}

/**
Adds all the edits back into the text at the right index
**/
function undoEdit(parts, edits){
  var cEdit; var index = 0;
  var i = 0; var iOffset = 0;
  var editPart;
  while(edits.length != 0){
    cEdit = edits.pop();
    //find the right part to put the edit in
    index = 0; i = 0;
    while(i <= parts.length && index + parts[i].length < cEdit.index){
      index += parts[i].length;
      i++;
    }
    //only decrement if the loop above has affected the i variable
    if(i > 0) i--;

    iOffset = cEdit.index - index;
    console.log('i: ' + i + '\ncedit.charac: ' + cEdit.character + '\niOffset: ' + iOffset);
    editPart = parts[i];
    parts[i] = editPart.substring(0, iOffset) + cEdit.character + editPart.substring(iOffset, editPart.length);
  }
  return parts;
}

/**
Starts to build the dictionary for the provided text
**/
function buildDictionary(name, text){
  var i = 0;
  var dict = {};
  var max = text.length - K;
  var part = '';
  for(i = 0; i < max; i++){
    part = text.substr(i, K);
    if(part in dict){
      dict[part].push(i);
    }else{
      dict[part] = [i];
    }
  }
  message('DictDone', {'textName':name, 'dictionary': dict});
}

/**
Makes sure the messages are always nicely formatted according to my expectations
meaning: always define an action and params.
**/
function message(action, parameters){
  postMessage({'action' : action, 'params' : parameters});
}
