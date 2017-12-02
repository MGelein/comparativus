(function(_c){
        //Define 2PI
        var tau = Math.PI * 2;

        //Pad angle is the space between texts in the arc
        var padAngle = 0.05;
        
        //Define the area of the rect
        var w = 1280;
        var h = 720;
        var w2 = w / 2;
        var h2 = h / 2;
        
        //Defines the circle
        var arc = d3.arc()
            .innerRadius(h2 - 50)
            .outerRadius(h2);

    
        /**
         * Holds the public methods for the visualization
         */
        _c.vis = {
            /**
             * Defined width and height for future use
             */
            width: w,
            height: h,

            /**
             * Color scheme
             */
            color: d3.scaleOrdinal(d3.schemeCategory10),

            /**
             * Reference to the SVg we will draw on
             */
            svg: undefined,

            /**
             * Initializes the visualization. Called on document read
             */
            init: function(){
                //hide the svg
                $('.svg-canvas').hide();
                //save a reference to the svg
                comparativus.vis.svg = d3.select('.svg-canvas');
            },

            /**
             * Draws the visualisation
             */
            draw: function(){
                //Get all text ids
                var textIDS = comparativus.text.getAllIDs();

                //Fade in the svg div
                $('.svg-canvas').fadeIn(1000);
                
                //First draw the text circle parts
                comparativus.vis.drawTexts(textIDS);

                //Then draw the nodes on each text
                comparativus.vis.drawNodes(textIDS);
            },

            /**
             * Draws the nodes for each of the provided texts
             */
            drawNodes: function(textIDS){
                //Create a holder for the nodes
                var nodeHolder = comparativus.vis.svg.append("g")
                    .attr("transform", "translate(" + comparativus.vis.width / 2  + "," + comparativus.vis.height / 2 + ")");
                
                //For each text add all the nodes
                textIDS.forEach(function(id, index){
                    //All nodes for this text
                    var nodes = comparativus.nodes[id];
                    //Node color
                    var nColor = comparativus.vis.color(index + 2);
                    
                    //Now draw each node onto the circle
                    nodes.forEach(function(node){
                        console.log(node);
                    });
                });             
            },

            /**
             * Draws the texts and their info onto the screen
             */
            drawTexts: function(textIDS){
                //Create a holder for the texts
                var textHolder = comparativus.vis.svg.append("g")
                    .attr("transform", "translate(" + comparativus.vis.width / 2  + "," + comparativus.vis.height / 2 + ")");
            
                //Get all text objects
                var text, sAngle = 0, tAngle, legendY = 0;
                textIDS.forEach(function(id, index){
                    text = comparativus.text.getByID(id);
                    //Get the angle for this text in the circle
                    tAngle = (tau - (padAngle * comparativus.text.amt())) * comparativus.text.getPercentLength(id);
                    //Now add an arc to the text holder
                    var tColor = comparativus.vis.color(index);
                    textHolder.append("path")
                        .datum({startAngle: sAngle, endAngle: sAngle + tAngle})
                        .style("fill", tColor)
                        .attr("d", arc);
                    sAngle += tAngle + padAngle;

                    //Also draw a rect in the legend
                    textHolder.append("rect")
                        .style("fill", tColor)
                        .style("stroke", d3.rgb(tColor).darker())
                        .attr("x", -w2 + 10)
                        .attr("y", -h2 + legendY + 20)
                        .attr("width", 20)
                        .attr("height", 20);
                    
                    //Now draw the name with the legend rect
                    textHolder.append("text")
                        .attr("x", -w2 + 40)
                        .attr("y", -h2 + legendY + 36)
                        .text(text.name);

                    //Now draw the character length with the name
                    textHolder.append("text")
                        .attr("x", -w2 + 40)
                        .attr("y", -h2 + legendY + 48)
                        .attr("class", "small")
                        .text(text.plain.length + " characters");

                    legendY += 50;
                });
            }
    
        
        };
    })(comparativus);