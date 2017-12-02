(function(_c){
    
        /**
         * Holds the public methods for the visualization
         */
        _c.vis = {
            /**
             * Defined width and height for future use
             */
            width: 900,
            heigth: 900,

            /**
             * Color scheme
             */
            color: d3.scaleOrdinal(d3.schemeCategory10),

            /**
             * Reference to the SVg we will draw on
             */
            svg,

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

            }
    
        
        };
    })(comparativus);