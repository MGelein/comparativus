//defined width and height here
var w = 900; var h = 300;

//the margins of the text bar
var textMargins = {top: 20, left: 0, bottom: 70, right: 0};

//the color scale to use
var color = d3.scaleOrdinal(d3.schemeCategory10);

//Create the SVG that we will draw on
var svg = d3.select(".svg-canvas");

//Now load the JSON and parse it
d3.json("data/Matches-Mencius-ZGZY.json", function(err, dataset) {
  var textLength = {};
  //create the text-holder group
  var textHolder = svg.append("g").classed('text-holder', true);

  //Add the two rects
  textHolder.selectAll("rect")
            .data(dataset.texts)
            .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', function(d, i){return (i > 0 ) ? h - textMargins.bottom : textMargins.top;})
            .attr('width', w)
            .attr('height', 50);

  //info about the texts
  textHolder.selectAll("texts")
            .data(dataset.texts)
            .enter()
            .append('text')
            .attr('x', 0)
            .attr('y', function(d, i){return (i > 0 ) ? h - 5 : 15;})
            .text(function(d){
              //save the textlength to an array
              textLength[d.name] = d.textLength;
              return d.name + " : " + d.textLength + " characters";
            })

  //add all the text nodes
  var nodeHolder = svg.append("g").classed('node-holder', true);

  //add the rects that represent the Matches-Mencius-ZGZY
  nodeHolder.selectAll("rect")
            .data(dataset.nodes)
            .enter()
            .append('rect')
            .attr('y', function(d){return (d.group == 0) ? h - 70 : 20;})
            .attr('x', function(d){return (d.index / textLength[(d.group == 0) ? 'Mencius' : 'ZGZY']) * w;})
            .attr('width', function(d){return getNodeWidth(d.l, d.group)})
            .attr('height', 50);

  //holder of all the links between the nodes
  var linkHolder = svg.append("g").classed('link-holder', true);

  //add all the links from the data
  linkHolder.selectAll('path')
            .data(dataset.links)
            .enter()
            .append('path')
            .attr('stroke-width', function(d){ getNodeWidth(d.l, 0)})
            .attr('d', function(d){return getPathDirections(dataset, d.source, d.target);});

            /**
            Returns the directions for the path to take
            **/
            function getPathDirections(dataset, sourceID, targetID){
                var pathString = "M " + getNodeX(dataset, sourceID) + ","
                                      + getNodeY(dataset, sourceID);
                pathString += " C " + getNodeX(dataset, sourceID) + ","
                                    + h/2;
                pathString += " "   + getNodeX(dataset, targetID) + ","
                                    + h/2;
                pathString += " " + getNodeX(dataset, targetID) + ","
                                    + getNodeY(dataset, targetID);
                return pathString;
            }
            /**
            Returns the node from the provided dataset with the provided ID
            **/
            function getNodeByID(dataset, id){
                var i = 0; var temp;
                do{
                  temp = dataset.nodes[i];
                  i++;
                }while(temp.id != id)
                if(temp.id == id) return temp;
            }
            /**
            Returns the x-coord of this node
            **/
            function getNodeX(dataset, id){
              d = getNodeByID(dataset, id);
              return (d.index / textLength[(d.group == 0) ? 'Mencius' : 'ZGZY']) * w;
            }
            /**
            Returns the y coord of this node
            **/
            function getNodeY(dataset, id){
              d = getNodeByID(dataset, id);
              return (d.group != 0) ? 70 : h - 70;
            }
            /**
            Provide the length and get the transformed length
            **/
            function getNodeWidth(length, group){
              var l = (length / textLength[(group == 0) ? 'Mencius' : 'ZGZY']) * w;
              return Math.max(1, l);
            }
});
