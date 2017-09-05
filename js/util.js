(function(_c){
    /**
     * Defines the utility object with some useful
     * functionality
     */
    _c.util = {
        /**
         * Returns the levenSthein ratio [0-1] similarity between
         * the two provided string. 1 means they're identical. 0
         * means they are completely different
         */
        levDistRatio : function(sA, sB){
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
    };
})(comparativus);