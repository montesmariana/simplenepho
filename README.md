# SimpleNepho
This application is a visualization tool for 2D scatterplots with certain characteristics,
tailored for token-level 'clouds'.

## Input

You need at least a tab-separated-file with a row per token and the following columns:

- **_id**, where the values are the ids of the tokens.
- **model.x** & **model.y**, where the values are the horizontal and vertical coordinates of each token respectively.
- **_ctxt.[whatever]** columns with contexts. It could be one or more, the value in 'whatever' will be shown in the
'Contexts' dropdown and the value of the corresponding column will appear in the tooltip when hovering over a token.
The texts in the column can be coded with html markup. For the target token to be highlighted by the application,
it should be inclosed in 'span' tags with the 'target' class: "<span class='target'>[YOUR TARGET]</span>".
- **_cws.[whatever]** column (only one). The values must be semicolon (';') separated items (e.g. context words) for each
token. Their count will be shown in the Frequency Table when clicking on the corresponding buttons.
It is also possible to select tokens based on partial matching with one of those items.
- other variables without specific prefixes: categorical variables will be taken for color and shape coding,
while numerical variables for size coding.

It is possible to add PPMI/frequency values of the context words in the **_cws.[whatever]** column by opening another
tab-separated-file from the Frequency Table, with the following columns:

-cw, where the values are the same items in the **_cws.[whatever]** column
-any value you want to see of the context words (ppmi, raw frequency, co-occurrence frequency...)

### File name restrictions

There are no actual file name restrictions, except (eventually?) for the tab-separated-extension, since you select them yourself.

## Features

Once you open your file, the app displays the cloud as a zoomable, interactive scatterplot, where each dot represents
a token (a row in your dataframe).

### Dropdown menues
With the color, shape and size dropdown menues you could select a categorical (for color and shape) or numerical (for size)
variable from your dataframe to code your dots. Numerical variables with more than 5 values will be rearranged to 5.

A clickable legend will appear over the plot: if you click on an item of the legend, the dots with that value in the given variable
will be selected. This does not work for numerical values, since they may be continuous.

The coding can be reset by choosing the last option on the corresponding dropdown menu ("Reset").

#### Context dropdown menu
To allow for coded contexts (with highlighted context words), there is a dropdown menu gathering all columns with the **_ctxt**. prefix.
By clicking on one of these options, the corresponding value will be shown on top of the cloud when hovering over a token.

### Click vs select

By default, you can click on individual dots to select them or deselect them. By clicking on the "Select" option, you can
draw a rectangle anywhere on the plot to select an area of it. The selected area can also be moved around.

### Frequency table
If you have selected tokens, you can call a Frequency Table of the context words listed in the **_cws.[whatever]** column,
and even add weight information.

### Find tokens
You can type (a part of) a word to select all tokens that have it in the **_cws.[whatever]** column (first search box) or in the concordance in general (second search box).

## Download
You can download the installer [here](https://github.com/montesmariana/simplenepho/tree/master/Download).
