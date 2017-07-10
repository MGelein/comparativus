/**
Creates the TSV save file. Use the generated TSV parts to make the
file
**/
function createTSVFile(tsvParts){
  createFileDownloadLink(getFileDownloadName('.tsv'),
   'data:text/tsv;charset=utf-8,' + encodeURI(tsvParts.join('\n')));
}

/**
Creates a JSON file describing the foudn matches and the compared texts
**/
function createJSONFile(matches){
  //convert the matches object to nodes and links
  jsonFile = {};
  jsonFile.texts = [];
  jsonFile.texts.push(
    {
      name: getFileName('a'),
      textLength: texts.a.length,
      group: 0
    }
  );
  jsonFile.texts.push(
    {
      name: getFileName('b'),
      textLength: texts.b.length,
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

  createFileDownloadLink(getFileDownloadName('.json'),
  "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonFile)));
}

/**
Generates the download file based upon the texts compared
**/
function getFileDownloadName(type){
  var names = "Matches";
  $('.fileName').each(function(i, val){
    names += '-' + $(val).html().replace(/\.[^/.]+$/, "");
  });
  names += type.toLowerCase();
  return names;
}
/**
This method takes care of the actual downloading of the file
**/
function createFileDownloadLink(fileName, href){
  var link = document.createElement("a");
  link.download = fileName;
  link.href = href;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  delete link;
}
