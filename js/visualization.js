(function(_c){

    /**
     * Defined width of the svg canvas to draw on
     */
    var w = 900;
    /**
     * Defined height of the svg canvas to draw on
     */
    var h = 150;
    /**
     * The color scale to use. This is sort of an color-scheme
     */
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    /**
     * Get a reference to the SVG we will draw on
     */
    var svg;
    /**
     * Object that holds all the text -lengths ordered by their name
     */
    var textLength = {};
    /**
     * The margins of the text-bar
     */
    var textMargins = {top: 20, left: 0, bottom: 50, right: 0};

    
    /**
     * Returns a pathString that can be used to draw a curve
     * using SVG graphics.
     * @param {Array} dataset 
     * @param {String} sourceID 
     * @param {String} targetID 
     */
    var getPathDirections = function(dataset, sourceID, targetID){
        return "M" + getNodeX(dataset, sourceID) + "," + getNodeY(dataset, sourceID)
            + " C" + getNodeX(dataset, sourceID) + "," + h / 2
            + " "  + getNodeX(dataset, targetID) + "," + h / 2
            + " "  + getNodeX(dataset, targetID) + "," + getNodeY(dataset, targetID);
    }

    /**
     * Loops through all nodes to find the one described
     * by this ID
     * @param {Array} dataset 
     * @param {String} id 
     */
    var getNodeByID = function(dataset, id){  
        var i = -1;      
        while(i++ < dataset.nodes.length - 1){
            if(dataset.nodes[i].id == id) return dataset.nodes[i];
        }
    }

    /**
     * Returns all the links that are attached to the provided node
     * @param {Array} dataset 
     * @param {String} nodeName 
     */
    var getLinksByNode = function(dataset, nodeName){
        var i = -1; var temp;
        var results = [];
        while(i++ < dataset.links.length - 1){
            temp = dataset.links[i];
            if(temp.source == nodeName || temp.target == nodeName) results.push(temp);
        }
        return results;
    }

    /**
     * Returns the x-coord of this node
     * @param {Array} dataset 
     * @param {String} id 
     */
    var getNodeX = function(dataset, id){
        var d = getNodeByID(dataset, id);
        //get the x coordinate relative to the length of the text
        return (d.index / textLength[(d.group == 0) ? 'Mencius' : 'ZGZY']) * w;
    }

    /**
     * Returns the y-coord of this node
     * @param {Array} dataset 
     * @param {String} id 
     */
    var getNodeY = function(dataset, id){
        var d = getNodeByID(dataset, id);
        return (d.group != 0) ? 50 : h - 50;
    }

    /**
     * Transforms the match lenght to a relative pixel value
     * compared to the text-lenght on screen
     * @param {Integer} length 
     * @param {Integer} group 
     */
    var getNodeWidth = function(length, group){
        var l = (length / textLength[(group == 0) ? 'Mencius' : 'ZGZY']) * w;
        //At least return 2, no lower than that
        return Math.max(2, l);
    }

    /**
     * Highlights or unhighlights all the links and datanodes that are connected to the provided node
     * @param {Array} dataset 
     * @param {Object} nodeData 
     */
    var highlightMatchPairs = function(dataset,node, nodeData, enabled){
        //Set the values we are setting to the right value depending if we are enabling or disabling
        var opacity = (enabled) ? 1.0 : 0.5;
        var nodeColor = (enabled) ? 'red' : 'green';
        var strokeWidth = (enabled) ? 2.0: 1.0;

        //First set values for the node itself
        d3.select(node).attr('opacity', opacity)
            .classed('selected', enabled);  

        //Get all the links attached to it
        var links = getLinksByNode(dataset, nodeData.id);
        links.forEach(function(link, index){
            //Show the link better
            var linkID = link.source + link.target + "";
            d3.select('[data-id=' + linkID + "]")
                .attr('opacity', opacity)
                .classed('selected', enabled)
                .attr('stroke-width', strokeWidth);

            //Show the other match part better
            d3.select('[data-id=' + linkID.replace(nodeData.id, ''))
                .attr('opacity', opacity)
                .classed('selected', enabled)
        }); 
    }

    /**
     * Holds the public methods for the visualization
     */
    _c.visualization = {

        /**
         * Initializes the visualization. Called on document read
         */
        init: function(){
            //hide the svg
            $('.svg-canvas').hide();
            //save a reference to the svg
            svg = d3.select('.svg-canvas');
        },

        /**
         * This function draws the paralell coords visualization
         * using the provided json Data object
         */
        draw: function(jsonData){
            //Initialize the object that holds the text length
            textLength = {};
            //Copy the jsonData
            var dataset = jsonData;
            //A copy for external use
            comparativus.visualization.data = jsonData;
            //Create a new text-holder group
            var textHolder = svg.append('g').classed('text-holder', true);
            
            //Add the two text rectangles
            textHolder.selectAll('rect')
                        .data(dataset.texts)
                        .enter()
                        .append('rect')
                        .attr('x', 0)
                        .attr('y', function(d, i){return (i > 0) ? h - textMargins.bottom : textMargins.top})
                        .attr('width', w)
                        .attr('height', 30);

            //Show the info about the texts
            textHolder.selectAll('texts')
                        .data(dataset.texts)
                        .enter()
                        .append('text')
                        .classed('textInfo', true)
                        .attr('x', 0)
                        .attr('y', function(d, i){return (i > 0 ) ? h - 5 : 15;})
                        .text(function(d){
                            textLength[d.name] = d.textLength;
                            return d.name + " : " + d.textLength + " characters"
                        });
            
            //Holder for the text-match nodes
            var nodeHolder = svg.append('g').classed('node-holder', true);

            //Add all the nodes (matches) from the data
            nodeHolder.selectAll('rect')
                        .data(dataset.nodes)
                        .enter()
                        .append('rect')
                        .attr('y', function(d){return (d.group == 0) ? h - 50 : 20;})
                        .attr('x', function(d){return Math.round((d.index / textLength[(d.group == 0) ? 'Mencius' : 'ZGZY']) * w);})
                        .attr('width', function(d){return getNodeWidth(d.l, d.group)})
                        .attr('height', 30)
                        .attr('opacity', 0.5)
                        .attr('data', function(d){return encodeURI(JSON.stringify(d))})
                        .attr('data-id', function(d){return d.id;})
                        .on('mouseover', function(d){
                            highlightMatchPairs(dataset, this, d, true);  
                        }).on('mouseout', function(d){
                            highlightMatchPairs(dataset, this, d, false);              
                        });    
            
            //Holder of all the links between the nodes
            var linkHolder = svg.append('g').classed('link-holder', true);

            //Add all the links from the data
            linkHolder.selectAll('path')
                        .data(dataset.links)
                        .enter()
                        .append('path')
                        .attr('stroke-width', 1)
                        .attr('opacity', 0.5)
                        .attr('data', function(d){return encodeURI(JSON.stringify(d))})
                        .attr('data-id', function(d){return d.source + d.target})
                        .attr('d', function(d){return getPathDirections(dataset, d.source, d.target);});            
            
            //Fade in the canvas
            $('.svg-canvas').fadeIn(1000);                        
        }
    };
})(comparativus);