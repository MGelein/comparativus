/**BLAST seed size*/
var K = 4;
var matchChar = '⁑';

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
        buildDictionary(params.id, params.text);
        break;
    case 'decorateText':
        decorateText(params.textName, params.text, params.match, params.edits);
        break;
    case 'prepareText':
        prepareText(params.id, params.text, params.config);
        break;
  }
}

/**
This function prepares the text data for comparison by removing whitespace and/
or punctuation according to the config object. It does this non destructively
by keeping track of where characters are removed so they can be re-added on a
later date.
**/
function prepareText(id, text, config){
  //console.log('preparing text for use: ' + name);
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
  }
  //then try to strip all punctuation
  if(config.stripPunctuation){
    chars = ['。', '』', '」', '，', '《', '》', '：', '『', '？', '「', '；', ',', '.', '!', '?'];
    result = removeAndKeepTrack(text, edits, chars);
    edits = result.edits;
    text = result.text;
    //text = text.replace(/。|』|」|，|《|》|：|『|？|「|；/g, '');
  }
  //now send the result back to the main thread
  message('PrepareDone', {'id':id, 'text':text, 'edits': edits});
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
Removes and keep track of one type of character
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
function decorateText(id, text, nodes, edits){
  console.log("Starting text decoration of " + id);
  var max = nodes.length;
  var n;
  var index;
  var indexOffset = 0;
  //list of inserted ID's
  var inserted = [];
  for(var i = 0; i < max; i++){
      n = nodes[i];
      text = text.insertAt(n.index + indexOffset, matchChar);
      inserted.push({
        'index': index + indexOffset,
        'start': true,
        'id': id + index,
        'node': n
      });
      indexOffset ++;
      text = text.insertAt(n.index + indexOffset + n.match.l, matchChar);
      inserted.push({
        'index': index + indexOffset + n.match.l,
        'start': false,
        'id': id + index + n.match.l,
        'node': n
      });
      indexOffset ++;
  }
  //Sort inserted elements by index
  inserted.sort(function(a, b){return a.index - b.index;});
  //now split on the start of every match
  var parts = text.split(matchChar);
  //undo all the edits that have been done
  parts = undoEdit(parts, edits);
  //add all the startCharacters back in
  text = parts.join(matchChar);

  //keep track of the match ID
  var matchID = 0;
  //replace all startCharacters
  while(text.indexOf(matchChar) != -1){
      text = text.replace(matchChar, generateMatchMark(inserted[matchID]));
      matchID++;
  }
  message('DecorateDone', {'id':id, 'result': text});
}

/**
Generates the left id mark and sets the id to the provided id
**/
function generateMatchMark(insertedObj){
    var content = (insertedObj.start) ? "◀" : "▶";
    var span =  "<span class='matchMark " + ((insertedObj.start) ? 'start' : 'end') 
    +"' id='" + insertedObj.id + "' data='" + JSON.stringify(insertedObj.node) + "'"
    + "onmouseover='comparativus.popover.showData(this);'>"
    + content + "</span>";
    return span;
}

/**
Adds all the edits back into the text at the right index
**/
function undoEdit(parts, edits){
  var cEdit; var index = 0;
  var i = 0;
  var editPart;

  //Keep looping untill all edits have been processed
  while(edits.length != 0){
    cEdit = edits.pop();
    //keep removing part lengths from the edit index to create the local offset
    i = 0;
    while(cEdit.index > 0){
      editPart = parts[i];
      i++;
      cEdit.index -= editPart.length;
    }
    //add back the one part that tipped the scales
    cEdit.index += editPart.length;
    i--;

    //now add the character at that index
    parts[i] = editPart.insertAt(cEdit.index, cEdit.character);
  }

  return parts;
}

/**
Starts to build the dictionary for the provided text
**/
function buildDictionary(id, text){
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
  message('DictDone', {'id':id, 'dictionary': dict});
}

/**
Makes sure the messages are always nicely formatted according to my expectations
meaning: always define an action and params.
**/
function message(action, parameters){
  postMessage({'action' : action, 'params' : parameters});
}

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
}