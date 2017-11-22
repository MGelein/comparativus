/**
 * Anonymous function for this file
 */
(function (_c){
    /**
     * The popover object that will hold all the methods
     */
    _c.popover = {
        /**
         * Holds a JQ ref to the element of the popover in the DOM
         */
        pop: {},
        /**
         * Initializes the popover module
         */
        init: function(){
            comparativus.popover.pop = $('#popover');
        },

        /**
         * Shows the content that is supplied as a parameter as the
         * content of the popover div. The content should be HTML string
         * @param content {String}  HTML content as string
         * @param top   {Number}    the top coordinate (y coordinate)
         * @param left  {Number}    the left coordinate (x coordinate)
         */
        show: function(content, top, left){
            var coords = {'top': top, 'left': left};
            comparativus.popover.pop.offset(coords);
            comparativus.popover.pop.html(content);
            comparativus.popover.pop.fadeIn();
        },

        /**
         * Hides the popover. Does NOT empty it. 
         */
        hide: function(){
            comparativus.popover.pop.fadeOut();
        }
    };
})(comparativus);