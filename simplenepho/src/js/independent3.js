function execute(dataset, type, model) {
  var width, height, padding;
  var contexts;
  var modselection, tokselection;
  var ctxtvar, tailoredcontexts;
  var cws_column;
  var svg, dot, brush;
  var colorDropdown, shapeDropdown, sizeDropdown, ctxtDropdown, modDropdown;
  var x, y, xrange, yrange; //set scales
  var xCenter, yCenter, xAxis, yAxis;  
  // var dataset = datasets[0];
  var level = 'token';

  // set the base of the svg area

  width = 600;
  height = 600;
  padding = 40;

  d3.select("h1").html("Level 3 (<em>" + type + "</em>)");
  
  initVars(dataset, level, type);
  contexts = colnames['contexts'];
  // modselection = listFromLS("modelselection-" + type);

  // model = getUrlParameter('model');
  // d3.select("h2").html(model);
  ctxtvar = varFromLS(dataset, "ctxt", level, type)['variable'];

  tailoredcontexts = contexts.filter(function(d) {return (d.split('.').length == 2 || model.search(d.split('.').splice(1).join('.')) == 0)})
    .map(function(d) {
      return({'key' : d.split('.').length === 2 ? d.split('.')[1] : 'model',
      'value' : d});
    });

  numerals = numerals.filter(function(d) {
    return(!d.startsWith('_count') || model.search(d.split('.').splice(1).join('.')) === 0);
  })
    .map(function(d) {
        return({'key' : d.startsWith('_count') ? 'number of foc' : d,
        'value' : d});
      });
  // These last lines are only if you use the 'ctxt2' dropdown instead of 'ctxt' (for tailored contexts, that is, matched to the cloud)

  // Context words!
  cws_column = colnames['all'].filter(function(d) {
      return(d.startsWith('_cws') && model.search(d.slice(5)) == 0)
    });

  tokselection = listFromLS(level + "selection-" + type);
  
  // Set up scales (axes, color...) - coordinates multiplied to get some padding in a way
  xrange = setRange(getValues(dataset, model + '.x'), 1.1);
  yrange = setRange(getValues(dataset, model + '.y'), 1.1);
  
  x = d3.scaleLinear()
    .domain(xrange)
    .range([padding, width-padding]);

  y = d3.scaleLinear()
    .domain(yrange)
    .range([height-padding, padding]);
  newX = x;
  newY = y;
 
  // set up dropdowns
  colorDropdown = buildDropdown("colour", nominals);
  shapeDropdown = buildDropdown("shape", nominals.filter(function(d) {return (getValues(dataset, d).length <= 7); }));
  sizeDropdown = buildDropdown("size", numerals, value_function = function(d) {return(d.value)}, text_function =function(d) {return(d.key)});

  // Use this dropdown for ctxt2 (context tailored to the cloud)
  ctxtDropdown = buildDropdown("ctxt2", tailoredcontexts,
    value_function = function(d) {return(d.value); },
    text_function = function(d) {return(d.key); });

  // NEXT LINE ONLY FOR MULTIPLE LEVELS
  // modDropdown = buildDropdown("models", modselection,
  //   value_function = undefined,
  //   text_function = function(d) {return(d.slice(7)); });

  // Set up canvas
  svg = d3.select("#svgContainer").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(responsivefy)
    .attr("transform", "translate(0,0)")
    .append("g")
    .call(d3.zoom().on('zoom', zoomed));
  
    // add tooltip (before the svg so it is not on top of it?)
  // tooltip = setTooltip("#svgContainer");
  // Set up pointing area so you can have zoom with the mouse in any point of the plot
  setPointerEvents(svg, width, height);
  // Vertical center
  xCenter = traceCenter(svg, x1 = newX(0), x2 = newX(0), y1 = padding, y2=height-padding);
  
  // Horizontal center
  yCenter = traceCenter(svg, x1 = padding, x2 = width-padding, y1 = newY(0), y2 = newY(0));
  
  // Axes (tickSizeOuter(0) avoids overlap of axes)
  xAxis = d3.axisBottom(newX).tickSizeOuter(0);
  svg.append("g")
    .attr("id", "xaxis")
    .attr("transform", "translate(0, " + (height-padding) + ")")
    .call(xAxis);

  yAxis = d3.axisLeft(newY).tickSizeOuter(0);
  svg.append("g")
    .attr("id", "yaxis")
    .attr("transform", "translate(" + padding + ", 0)")
    .call(yAxis);

  // Select brush or click
  $(document).on('change', 'input[name="selection"]', function(event) {
    var radio = d3.select(this).attr('value');
    if(radio == 'brush') {
      svg.append('g')
        .attr("transform", "translate(" + padding + ", " + padding + ")")
        .attr("class", "brush")
        .call(brush);
      } else {
        svg.selectAll(".brush").remove();
      }
      tokselection = [];
      updateTokSelection(tokselection);
  });
  
  // What happens with the zoom
  function zoomed() {
    newY = d3.event.transform.rescaleY(y);
    newX = d3.event.transform.rescaleX(x);
    svg.select('#xaxis').call(xAxis.scale(newX)); // x axis rescaled
    svg.select('#yaxis').call(yAxis.scale(newY)); // y axis rescaled
    dot_present.attr("transform", function(d) { return ("translate(" + newX(d[model + '.x']) + "," + newY(d[model + '.y']) + ")"); }); // dots repositioned
    xCenter.attr("x1", newX(0)).attr("x2", newX(0)); // central x rescaled
    yCenter.attr("y1", newY(0)).attr("y2", newY(0)); // central y rescaled
    svg.selectAll(".brush").remove();
  };

  // Design of The Dot  

  present = dataset.filter(function(d) {return (exists(d, model)); });
  bin = dataset.filter(function(d) {return (!(exists(d, model))); });

  svg.append("g")
    .attr("transform", "translate(0,0)")
    .attr("class", "dot")
    .selectAll("path")
    .data(present).enter()
      .append("path")
      .attr("class", "graph present")
      .attr("transform", function(d) { return ("translate(" + newX(d[model + '.x']) + "," + newY(d[model + '.y']) + ")"); })
      .each(styleDot);

  if (bin.length > 0) {
    var sidebar = d3.select("#sidebar");
    var sidebar_width = parseInt(sidebar.style("width"));
    var dots_per_row = Math.floor((sidebar_width-20)/10);

    sidebar.append("hr");
    sidebar.append("h4").text("Lost tokens");

    sidebar.append("svg")
      .attr("width", sidebar_width)
      .attr("transform", "translate(0,0)")
      .append("g")
        .attr("transform", "translate(" + 10 + "," + 10 + ")")
        .attr("class", "dot")
        .selectAll("path")
        .data(bin).enter()
          .append("path")
          .attr('class', "graph lost")
          .attr("transform", function(d) {
            var j = Math.floor(bin.indexOf(d)/dots_per_row);
            var i = bin.indexOf(d)-(j*dots_per_row);
            return("translate(" + (i*10) + "," + (j*10) + ")");
          })
          .each(styleDot);
  }

  function styleDot(p) {
    dp = d3.select(this);
    
    dp.attr("d", d3.symbol()
      .type(function (d) {return (code(d, shapevar, shape, d3.symbolCircle));})
      .size(function(d) {
        return( code(d, sizevar, size, 64));
        // if (typeof(sizevar['variable']) == 'string') {
        //   size.domain(d3.extent(dataset, function(d) {return +d[sizevar['variable']]; }));
        //   return(size(+d[sizevar['variable']]));
        // } else {
        //   return(64);
        // }
      }))
    .style('fill', function(d) {return code(d, colorvar, color, "#1f77b4"); })
    .classed("lighter", function(d) {return (tokselection.length > 0 ? (tokselection.indexOf(d['_id']) === -1) : false); })
    // .classed("lost", function(d) {return (!exists(d, model)); })
    .on("mouseover", showContext)
    .on('mouseout', function() {
      d3.select("#concordance").select("p").remove();
      // tooltip.transition()
      //   .duration(200)
      //   .style("opacity", 0);
      d3.selectAll(".selector").remove();
    })
    .on('click', function(d) {
      var modName = d['_id'];
      var modIndex = tokselection.indexOf(modName);
      if (modIndex > -1) {
        tokselection.splice(modIndex, 1);
      } else {
        tokselection.push(modName);
      }
      updateTokSelection(tokselection);
    });
  }

  dot = d3.selectAll('.dot').selectAll('path');
  dot_present = d3.selectAll('.dot').selectAll("path.present");

  // Set up brush
  brush = d3.brush()
    .extent([[0,0],[width, height]])
    .on('start', brushstart)
    .on('brush', brushing)
    .on('end', brushed);

  function brushstart() {
    tokselection = [];
  }

  function brushing() {
    var e = d3.event.selection;
    if (!(e == null)){
    dot.classed('lighter', function(d) {
      var xc = newX(d[model + '.x']);
      var yc = newY(d[model + '.y']);
      // var xc = d3.select(this).attr('xcoord');
      // var yc = d3.select(this).attr('ycoord');
      return ((xc < e[0][0]+padding ||
        xc > e[1][0]+padding ||
        yc < e[0][1]+padding ||
        yc > e[1][1]+padding) &&
        exists(d, model));
      });
      }
  }

  function brushed(p) {
    tokselection = [];
    dot.each(function(d) {
      if(!(d3.select(this).classed("lighter")) && exists(d, model)) {
        tokselection.push(d['_id']);
        }
      });
    updateTokSelection(tokselection);
  }

  // what happens when we click on the dropdowns?
  colorDropdown.on("click", function() {
    colorvar = updateVar(dataset, "color", this.value, level, type);
    colorselection = [];
    updatePlot();
    updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
  });

  shapeDropdown.on("click", function() {
    shapevar = updateVar(dataset, "shape", this.value, level, type);
    shapeselection = [];
    updatePlot();
    updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
  });

  sizeDropdown.on("click", function() {
    sizevar = updateVar(dataset, 'size', this.value, level, type);
    updatePlot();
    updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
  });

  ctxtDropdown.on("click", function() {
    ctxtvar = updateVar(dataset, 'ctxt', this.value, type)['variable'];
    dot.on("mouseover", showContext);
  });

  // modDropdown.on("click", function() {
  //   model = this.value;
  //   window.open("level3.html" + "?type=" + type + "&model=" + model, "_self");
  // });

  // clear selection of models
  d3.select("#clear-select")
    .on("click", function() {
      tokselection = [];
      cleanStor("colorsel-" + level + '-' + type);
      cleanStor("shapesel-" + level + '-' + type);
      cleanStor("sizesel-" + level + '-' + type);
      updateTokSelection(tokselection);
    });

  // d3.select("#model-select")
  //   .on("click", function() {
  //     window.open("level2.html" + "?type=" + type, "_self");
  //   });

  // Updating color, shape and size after every button clicking
  function updatePlot() {
    dot.style("fill", function(d) {return (code(d, colorvar, color, "#1f77b4")); })
      .attr("d", d3.symbol()
        .type(function(d) {return (code(d, shapevar, shape, d3.symbolCircle)); })
        .size(function(d) {return (code(d, sizevar, size, 64)); }));
  }

  
  d3.select("#findtokens_btn").on('click', function() {
    var cw_to_search = d3.select("#findtokens_cw").property('value');
    var result = dataset.filter(function(d) {
        return(d[cws_column].split(';').filter(function(p) {
            return (p.search(cw_to_search) !== -1);
        }).length > 0);
        });
    if (result.length > 0) {
        tokselection = d3.map(result, function(d) {return(d['_id']); }).keys();
        updateTokSelection(tokselection);
    } else {
        window.alert('Sorry, "' + cw_to_search + '" is not present as a feature in this model.');
    }
    })

  d3.select("#findtokens_btn_raw").on('click', function() {
    var cw_to_search = d3.select("#findtokens_ctxt").property('value').toLowerCase();
    var result = dataset.filter(function(d) {
      raw_ctxt = tailoredcontexts.filter( d => d.key === 'raw')[0].value;
        return(d[raw_ctxt].toLowerCase().search(cw_to_search) !== -1);
        });
    if (result.length > 0) {
        tokselection = d3.map(result, function(d) {return(d['_id']); }).keys();
        updateTokSelection(tokselection);
    } else {
        window.alert('Sorry, no context includes the requested string.');
    }
    });  
  // update model selection
  function updateTokSelection(tokselection) {
    updateSelection(tokselection, level, type);
  }
    function showContext(d) {
      // let position = d3.select(this).attr("transform").split(',');
      // let xcoord = +(position[0].split('(')[1]) > 250 ? padding : position[0].split('(')[1];
      // let ycoord = position[1].split(')')[0];
      var tooltipcolor = code(d, colorvar, color, "#1f77b4");
      // var tooltiptext = typeof(ctxtvar) == 'string' ? d[ctxtvar].replace(/<em>/g, "<em style='color:" +tooltipcolor + ";font-weight:bold;'>") : ""
      ctxtvar = typeof(ctxtvar) === 'string' ? ctxtvar : '_ctxt.raw';
          if (tailoredcontexts.filter(function(d) {return (d.value === ctxtvar); }).length < 1) {
            const new_value = tailoredcontexts.filter( d => d.key === 'model')[0].value;
            ctxtvar = updateVar(dataset, 'ctxt', new_value, level, type)['variable'];
          }
          var tooltiptext = '<p><b>' + d['_id'] + '</b></p><p>' + d[ctxtvar].replace(/class=["']target["']/g, "style='color:" +tooltipcolor + ";font-weight:bold;'") + '</p>';
          // var tooltiptext = d[model + '.x'] + ', ' + d[model + '.y'];

      d3.select("#concordance").append("p")
        .attr("class", "text-center p-2 ml-2")
        .style("border", "solid")
        .style("border-color", "gray")
        .style("font-size", "0.8em")
        .html(tooltiptext);

      // tooltip.transition()
      //   .duration(200)
      //   .style("opacity", 1);
      // tooltip.html("<b style='color:" +tooltipcolor + "'>" + d['_id'] + "</b><br>" + tooltiptext)
      //   // .style("left", (d3.event.pageX + 10) + "px")
      //   // .style("top", (d3.event.pageY - 20) + "px")
      //   .style("top", (ycoord + "px"))
      //   .style("left", (xcoord + "px"))
      //   .style("width", width + 'px')
      //   .style("background-color", "white");
      let to_select = d3.select(this).classed("present") ? svg : sidebar;
      to_select.select(".dot")
        .append("path")
        .attr("class", "selector")
        .attr("transform", d3.select(this).attr("transform"))
        .attr("d", d3.symbol().type(d3.symbolCircle).size(250))
        .style("fill", "none")
        .style("stroke", compColor(d3.select(this).style("fill")))
        .style("stroke-width", 2);
      }

    updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    updateTokSelection(tokselection);

    d3.select("#show-table").on("click", function() {
      cws_selection = dataset.filter(function (d) {
        return (tokselection.indexOf(d['_id']) > -1);
      }).map(function (d) {
        return (d[cws_column]);
      });
      fs.writeFile(path.join(userDataPath, 'cws_selection.json'),
        JSON.stringify(cws_selection), function (err) {
          if (err) throw err;
          console.log("Saved!");
        });
      
      window.open("frequencyTable.html");
  });
}

      