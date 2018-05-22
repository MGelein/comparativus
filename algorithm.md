# Comparativus Algorithm
In this file I will try to explain the comparison algorithm used in *Comparativus* in detail following the comparison process step by step. But before we begin I would like to include a bit of history of *Comparativus* and its *raison d'être*. 

## 1. Comparativus History
In december 2016 I started working on a comparison module for the already succesful online text editing and annotating environment *MARKUS*. The initial development stage was mostly plagued by unfamiliarity with cross-browser compatability and methods used for text comparison. This stage took roughly the first half year and was mostly filled with experimentation with different algorithms and Javascript technologies. The real breakthrough came when in the first half of 2017 a brief but fruitful discussion with Dr. P. Vierthaler about his current work on large scale text comparison provided me with the basics of the algorithm currently used in *Comparativus*. 

In the summer of 2017 I was sent to Washington to cooperate on the [Homer Multitext](http://www.homermultitext.org) project where I discussed the problems I was still facing with their two main data architects, Dr. N. Smith and Dr. C. Blackwell. They gave me a basic understanding of their usage of URNs to mark a text location which made me develop the current simplified approach used in *Comparativus*.

In the fall and early spring of 2018 most of the final touches were made, bugs were squashed, and user feedback was implemented which led to the first public release of *Comparativus*. In this article I will discuss the state of the algorithm as of April 2018. Although *Comparativus* still lacks many of the features we want I'm positive the algorithm will remain mostly unchanged. Before we dive straight into an outline of the algorithm let's briefly discussed the (short) list of technology used in development of *Comparativus*.

## 2. Comparativus Technology
One of the demands of developing a *MARKUS* expansion was the need for it to be mostly client side. All of the code for *Comparativus* is writting in Javascript using some of the most recent technological advancements in the field such as Web Workers. This restriction on the code to run client side placed **major** restrictions on the complexity of the code and size of the texts compared. The use of external libraries and dependencies has been minimized as much as possible. Currently we're only using the following libraries:
- [JQuery](https://jquery.com/) (v. 3.1.1 as of April 2018) for DOM manipulation.
- [D3](https://d3js.org/) (v. 4.8.0 as of April 2018) for result visualisation.

## 3. Algorithm Outline
Below you can see a list of all the steps the algorithm takes to complete a comparison between two texts as well as a reference to the chapter in which we discuss this specific step. Before this algorithm runs I assume the texts have already been loaded by whatever API suits the needs of the user. In the case of *Comparativus* there are multiple ways of providing a text for comparison which are not at all related to the algorithm used. In the end the algorithm is provided with two texts stored as strings in Javascript.

1. Preparation. [Chapter 4](#4-preparation)
 1. Prepare every text for comparison. [Chapter 4.1](#4-1-text-preparation)
 1. Create a *dictionary* object for every text. [Chapter 4.2](#4-2-dictionary-creation)
2. Comparison.
 1. Determine overlapping seeds in *dictionaries*.
 1. For every overlapping seed, try to expand it.
3. Processing.
 1. Merge overlapping matches.
 1. Visualise the results.

I will try to skip as much *Comparitivus*-specific implementations as possible, such as the insertion of HTML-elements whilst still keeping characterindex numbers correct, but where it becomes relevant I will briefly describe how this specific process is implemented in *Comparativus*. The source code is available on [Github](https://www.github.com/MGelein/comparativus).

## 4. Preparation
Before any sort of comparison process can be started on the two provided texts, they need to be thoroughly cleaned and indexed for the comparison algorithm. The loading process of the texts is not relevant for our discussion about the algorithm. The texts are supplied as either plain text or as a tagged HTML text from MARKUS.

### 4.1. Text Preparation
The first step in text preparation is to remove any HTML tags. These tags could form too much noise in a comparison algorithm and are, naturally, not relevant for most comparisons. Stripping the tags is done using an invisible HTML element that is filled with the loaded text. Then we use JQuery to load only the text from that element. Both the original loaded data and the cleaned plain text data is stored.

The next step is to remove any other characters that could interfer with the comparison process. Most notably these characters are any form of whitespace and punctuation. This is where one of the first fundamental differences with Dr. Vierthaler's becomes clear. In his algorithm these characters can just be removed. In the case of *Comparativus* however we need to be able to visualise the matches we find, meaning we can't just remove characters without keeping track of their original location. The solution is inspired by the URNs used by the homermultitext project. 

Instead of keeping track of index numbers in a text, which is a traditional way of keeping track of location in a string, we keep track of which character was the preceding character. For example, let's say want to remove the space in the following phrase: 'Hello World'.

We would remove the space and then mark it as being removed after the first 'o', or `o[0]`. This notation allows us to remove characters while keeping track of their location without having to account for the change of length that is caused by the act of removing. This whole process is done on a separate Javascript Web Worker, basically a thread, to prevent the main GUI thread from hanging. When this is done, the texts are ready for the next step of the comparison: the creation of a 'dictionary'. 

### 4.2. Dictionary Creation
The dictionary is ofcourse a Python datatype. Since I'm writing in Javascript I don't have access to that specific datatype, but the Object datatype in Javascript is similar enough to work functionally the same. The text is sent to a Web Worker once again, where it will be turned into a dictionary object that will be sent back to be stored globally. 

This process can be summarized as going through the string, indexing every n-gram of seedlength K, a preset variable. Every n-gram is checked to see if this n-gram already exists. If it is already a key in the object, the index at which this n-gram has been found is added to the list of indeces for that n-gram. If the n-gram is not yet a key for the dictionary object, we make it a key with as its value the index at which this n-gram has been found. As an example, I'll show you the result of the following word:
```
Catbat
```
If we ignore the random nature of this word for a second, the algorithm will turn it into the following Javascript Object, if we use K=2 as seed size:
```
{
    "ca": [0],
    "at": [1, 4],
    "tb": [2],
    "ba": [3],
}
```
The effect of the seed size, K, on the algorithm and mostly the speed of the execution of the algorithm, is large. Smaller seedsizes mean that we have more seeds, resulting in larger dictionaries, more identical seeds and in the comparison more overlapping seeds. All of this means that the algorithm used with a smaller seed size is significantly slower to execute. So far, for Chinese texts, I've found a size of K=4 to work quite well. For european languages we can assume the seedsize could be larger, since the semantic value of four characters in chinese is larger than the value of four characters in for example English.

This process creates a 'dictionary' that holds the index or indeces for every n-gram in one of the texts. The created object is then passed back to the main process. Now we're ready for the user to start a comparison. The next step in the algorithm is triggered by user input.

## 5. Comparison
Once the user has submitted all texts for comparison and all these texts have been prepared for comparison as described above, we can start the actual comparison process. This process can involve more than two texts, but in that case it will still boil down two multiple one on one comparisons. For example: If we compare text A, B, and C we process the following comparisons: A with B, A with C, and B with C. This means that the basic process remains unchanged, therefore I'll only discuss a basic comparison of two texts. Let's call them, unimaginatively, text A and text B.

### 5.1. Overlapping Seeds
Our first step in the process is determining the overlap in the seeds, or n-grams, found in the dictionaries of both texts. This is done using a double for-loop, as shown below:
```
var ngramsA = Object.keys(dictionaryA);
var ngramsB = Object.keys(dictionaryB);
for(var i = 0; i < ngramsA.length; i++){
    for(var j = 0; j < ngramsB.length; j++){
        if(ngramsA[i] === ngramsB[j]){
            expandMatches(dictionaryA[ngramsA[i]], dictionaryB[ngramsB[j]]);
        }
    }
}
```
We loop through every possible n-gram in both texts and if we find a n-gram that is present in both texts, we pass the occurence indeces of that n-gram through to the `expandMatches` function. This function simple checks to see if a n-gram has multiple occurences, in which case it will try to expand every occurence of the n-gram in text A against every occurence of that same n-gram in text B.

### 5.2. Seed Expansion
## 6. Processing
### 6.1. Overlap Merging
### 6.2. Result Visualisation