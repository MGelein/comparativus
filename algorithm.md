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

1. Preparation.
 1. Prepare every text for comparison.
 1. Create a *dictionary* object for every text.
2. Comparison.
 1. Determine overlapping seeds in *dictionaries*.
 1. For every overlapping seed, try to expand it.
3. Processing.
 1. Merge overlapping matches.
 1. Visualise the results.

I will try to skip as much *Comparitivus*-specific implementations as possible, such as the insertion of HTML-elements whilst still keeping characterindex numbers correct, but where it becomes relevant I will briefly describe how this specific process is implemented in *Comparativus*. The source code is available on [Github](https://www.github.com/MGelein/comparativus).