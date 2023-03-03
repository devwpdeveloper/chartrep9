function makeLineChart(dataset, xName, yObjs, axisLables) {

    // chartObj is the main object that is returned
    var chartObj = {};
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    chartObj.xAxisLable = axisLables.xAxis;
    chartObj.yAxisLable = axisLables.yAxis;
    /*
     yObjsects format:
     {y1:{column:'',name:'name',color:'color'},y2}
     */
  
    // Add some values onto chartObj
    chartObj.data = dataset;
    chartObj.margin = {top: 15, right: 60, bottom: 30, left: 50};
    chartObj.width = 650 - chartObj.margin.left - chartObj.margin.right;
    chartObj.height = 480 - chartObj.margin.top - chartObj.margin.bottom;

    // So we can pass the x and y as strings when creating the function
    chartObj.xFunct = function(d){return d[xName]};

    // For each yObjs argument, create a yFunction
    function getYFn(column) {
        return function (d) {
            return d[column];
        };
    }

    // Object instead of array
    chartObj.yFuncts = [];
    for (var y  in yObjs) {
        yObjs[y].name = y;
        yObjs[y].yFunct = getYFn(yObjs[y].column); //Need this  list for the ymax function
        chartObj.yFuncts.push(yObjs[y].yFunct);
    }
    console.log(yObjs)

    // Formatter functions for the axes
    chartObj.formatAsNumber = d3.format(".0f");
    chartObj.formatAsDecimal = d3.format(".2f");
    chartObj.formatAsCurrency = d3.format("$.2f");
    chartObj.formatAsFloat = function (d) {
        if (d % 1 !== 0) {
            return d3.format(".2f")(d);
        } else {
            return d3.format(".0f")(d);
        }
        
    };

    chartObj.xFormatter = chartObj.formatAsNumber;
    chartObj.yFormatter = chartObj.formatAsFloat;

    chartObj.bisectYear = d3.bisector(chartObj.xFunct).left; //< Can be overridden in definition

    // Create scale functions
    chartObj.xScale = d3.scaleLinear()
      .range([0, chartObj.width])
      .domain(d3.extent(chartObj.data, chartObj.xFunct)); //< Can be overridden in definition

    // Get the max of every yFunct
    chartObj.max = function (fn) {
        return d3.max(chartObj.data, fn);
    };
    chartObj.yScale = d3.scaleLinear()
      .range([chartObj.height, 0])
      .domain([140, 190]);

    chartObj.formatAsYear = d3.format("");

    // Create axis
    chartObj.xAxis = d3.axisBottom()
      .scale(chartObj.xScale)
      .tickFormat(chartObj.xFormatter); 

    chartObj.yAxis = d3.axisLeft()
      .scale(chartObj.yScale)
      .tickFormat(chartObj.yFormatter); 


    // Build line building functions
    function getYScaleFn(yObj) {
        return function (d) {
            return chartObj.yScale(yObjs[yObj].yFunct(d));
        };
    }
    for (var yObj in yObjs) {
        yObjs[yObj].line = d3.line()
          .x(d => chartObj.xScale(chartObj.xFunct(d)))
          .y(getYScaleFn(yObj));
    }
    
    // Type the object here for some reason?
    chartObj.svg;

    // Change chart size according to window size
    chartObj.update_svg_size = function () {
        chartObj.width = parseInt(chartObj.chartDiv.style("width"), 10) - (chartObj.margin.left + chartObj.margin.right);

        chartObj.height = parseInt(chartObj.chartDiv.style("height"), 10) - (chartObj.margin.top + chartObj.margin.bottom);

        /* Update the range of the scale with new width/height */
        chartObj.xScale.range([0, chartObj.width]);
        chartObj.yScale.range([chartObj.height, 0]);

        if (!chartObj.svg) {return false;}

        /* Else Update the axis with the new scale */
        chartObj.svg.select('.x.axis').attr("transform", "translate(0," + chartObj.height + ")").call(chartObj.xAxis);
        chartObj.svg.select('.x.axis .label').attr("x", chartObj.width / 2);

        chartObj.svg.select('.y.axis')
          .call(chartObj.yAxis);
        chartObj.svg.select('.y.axis .label')
          .attr("x", -chartObj.height / 2);

        /* Force D3 to recalculate and update the line */
        for (var y  in yObjs) {
            yObjs[y].path.attr("d", yObjs[y].line);
        }
        

        d3.selectAll(".focus.line").attr("y2", chartObj.height);

        chartObj.chartDiv.select('svg')
          .attr("width", chartObj.width + (chartObj.margin.left + chartObj.margin.right))
          .attr("height", chartObj.height + (chartObj.margin.top + chartObj.margin.bottom));

        chartObj.svg.select(".overlay")
          .attr("width", chartObj.width)
          .attr("height", chartObj.height);
      
        return chartObj;
    };
    chartObj.bind = function (selector) {
        chartObj.mainDiv = d3.select(selector);

        // Add all the divs to make it centered and responsive
        chartObj.mainDiv
          .append("div")
            .attr("class", "inner-wrapper")
          .append("div")
            .attr("class", "outer-box")
          .append("div")
            .attr("class", "inner-box");
      
        chartSelector = selector + " .inner-box";
        chartObj.chartDiv = d3.select(chartSelector);
      
        
        d3.select(window)
          .on('resize.' + chartSelector, chartObj.update_svg_size);
      
        chartObj.update_svg_size();
        return chartObj;
    };

    // Render the chart
    chartObj.render = function () {
      
        //Create SVG element
        chartObj.svg = chartObj.chartDiv.append("svg").attr("class", "chart-area").attr("width", chartObj.width + (chartObj.margin.left + chartObj.margin.right)).attr("height", chartObj.height + (chartObj.margin.top + chartObj.margin.bottom)).append("g").attr("transform", "translate(" + chartObj.margin.left + "," + chartObj.margin.top + ")");

        // Draw Lines
        for (var y  in yObjs) {
            yObjs[y].path = chartObj.svg.append("path").datum(chartObj.data).attr("class", "line").attr("d", yObjs[y].line).style("stroke", color(y)).attr("data-series", y).on("mouseover", function () {
                focus.style("display", null);
            }).on("mouseout", function () {
                focus.transition().delay(700).style("display", "none");
            }).on("mousemove", mousemove);
        }
        

        // Draw Axis
        chartObj.svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + chartObj.height + ")").call(chartObj.xAxis).append("text").attr("class", "label").attr("x", chartObj.width / 2).attr("y", 30).style("text-anchor", "middle").text(chartObj.xAxisLable);

        chartObj.svg.append("g").attr("class", "y axis").call(chartObj.yAxis).append("text").attr("class", "label").attr("transform", "rotate(-90)").attr("y", -42).attr("x", -chartObj.height / 2).attr("dy", ".71em").style("text-anchor", "middle").text(chartObj.yAxisLable);

        //Draw tooltips
        var focus = chartObj.svg.append("g").attr("class", "focus").style("display", "none");

        for (var y  in yObjs) {
            yObjs[y].tooltip = focus.append("g");
            yObjs[y].tooltip.append("circle").attr("r", 5);
            yObjs[y].tooltip.append("rect").attr("x", 8).attr("y","-5").attr("width",22).attr("height",'0.75em');
            yObjs[y].tooltip.append("text").attr("x", 9).attr("dy", ".35em");
        }

        // Year label
        focus.append("text").attr("class", "focus year").attr("x", 9).attr("y", 7);
        // Focus line
        focus.append("line").attr("class", "focus line").attr("y1", 0).attr("y2", chartObj.height);

        //Draw legend
        var legend = chartObj.mainDiv.append('div').attr("class", "legend");
        for (var y  in yObjs) {
            series = legend.append('div');
            series.append('div').attr("class", "series-marker").style("background-color", color(y));
            series.append('p').text(y);
            yObjs[y].legend = series;
        }
// left yaxis text
          const Leftp = document.createElement("p");
          const lefttextp = document.createTextNode("WEIGHT (POUNDS LBS)");

          Leftp.appendChild(lefttextp);
                Leftp.classList.add("leftTextYaxis");
          document.querySelector(".inner-box").appendChild(Leftp);

          const bottomp = document.createElement("p");
          const bottomtextp = document.createTextNode("TIME DURATION");

          bottomp.appendChild(bottomtextp);
          bottomp.classList.add("bottomTextXaxis");
          document.querySelector(".inner-box").appendChild(bottomp);

        // Overlay to capture hover
        chartObj.svg.append("rect").attr("class", "overlay").attr("width", chartObj.width).attr("height", chartObj.height).on("mouseover", function () {
            focus.style("display", null);
        }).on("mouseout", function () {
            focus.style("display", "none");
        }).on("mousemove", mousemove);

        return chartObj;
        function mousemove() {
            var x0 = chartObj.xScale.invert(d3.mouse(this)[0]), i = chartObj.bisectYear(dataset, x0, 1), d0 = chartObj.data[i - 1], d1 = chartObj.data[i];
            try {
                var d = x0 - chartObj.xFunct(d0) > chartObj.xFunct(d1) - x0 ? d1 : d0;
            } catch (e) { return;}
            minY = chartObj.height;
            for (var y  in yObjs) {
                yObjs[y].tooltip.attr("transform", "translate(" + chartObj.xScale(chartObj.xFunct(d)) + "," + chartObj.yScale(yObjs[y].yFunct(d)) + ")");
                yObjs[y].tooltip.select("text").text(chartObj.yFormatter(yObjs[y].yFunct(d)));
                minY = Math.min(minY, chartObj.yScale(yObjs[y].yFunct(d)));
            }

            focus.select(".focus.line").attr("transform", "translate(" + chartObj.xScale(chartObj.xFunct(d)) + ")").attr("y1", minY);
            focus.select(".focus.year").text("Week: " + chartObj.xFormatter(chartObj.xFunct(d)));
        }

    };
    console.log('chartObj')
    console.log('===========')
    console.log(chartObj)
  
    return chartObj;
}
var data = [
  {
    "year": 0,
    "variableA": 180,
    "variableB": 180,
    "variableC": 180,
    "variableD": 180,
    "variableE": 180,
    "variableF": 180
  },
  {
    "year": 4,
    "variableA": 179.1,
    "variableB": 178.2,
    "variableC": 172.8,
    "variableD": 176.4,
    "variableE": 175.95,
    "variableF": 173.25
  },
  {
    "year": 8,
    "variableA": 180.9,
    "variableB": 176.4,
    "variableC": 171,
    "variableD": 170.1,
    "variableE": 172.8,
    "variableF": 169.2
  },
  {
    "year": 12,
    "variableA": 179.1,
    "variableB": 175.5,
    "variableC": 169.2,
    "variableD": 169.2,
    "variableE": 168.3,
    "variableF": 165.6
  },
  {
    "year": 16,
    "variableA": 180.9,
    "variableB": 175.05,
    "variableC": 169.02,
    "variableD": 165.6,
    "variableE": 165.6,
    "variableF": 160.2
  },
  {
    "year": 20,
    "variableA": 179.1,
    "variableB":174.6,
    "variableC": 168.84,
    "variableD": 164.7,
    "variableE": 162,
    "variableF": 156.6
  },
  {
    "year": 24,
    "variableA": 180.9,
    "variableB": 174.15,
    "variableC": 168.66,
    "variableD": 164.25,
    "variableE": 156.6,
    "variableF": 153
  },
  {
    "year": 28,
    "variableA": 179.1,
    "variableB": 173.7,
    "variableC": 168.48,
    "variableD": 163.8,
    "variableE": 153,
    "variableF": 149.4
  },
  {
    "year": 32,
    "variableA": 180.9,
    "variableB": 174.15,
    "variableC": 168.3,
    "variableD": 162.9,
    "variableE": 147.6,
    "variableF": 145.8
  },
  
]
var chart = makeLineChart(data, 'year', {
  'Do Nothing': {column: 'variableA'},
  'Control (based on wegovy paper)': {column: 'variableB'},
  'Phentermine': {column: 'variableC'},
  'Qsymia': {column: 'variableD'},
  'Wegovy': {column: 'variableE'},
  'Mounjaro': {column: 'variableF'},
}, {xAxis: 'Years', yAxis: 'Amount'});

chart.bind("#chart-line1");
chart.render();


