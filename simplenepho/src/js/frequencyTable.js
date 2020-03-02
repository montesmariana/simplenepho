function execute(datasets, other_args) {
    var tokselection, table, cws, freqcols, freqs, type;
    var bigdata = datasets[0];
    var freqdata = datasets[1];
    var cws_column = other_args;
    console.log(freqdata)

    tokselection = type === undefined ? undefined : listFromLS("tokenselection-" + type);
    cws = bigdata === null ? cws_column : bigdata.filter(function (d) {
        return (tokselection.indexOf(d['_id']) !== -1);
    }).map(function (d) {
        return (d[cws_column]);
    });
    
    var mySet = new Set(cws.join(';').split(';'));
    freqcols = d3.keys(freqdata[0]).filter(function (d) { return (d !== 'cw') });
    
    cwsFreq = Array.from(mySet).map(function (d) {
        var freqs = freqdata.filter(function (p) {
            return (p.cw == d);
        })[0];

        var tokens = cws.filter(function (p) {
            return (p.split(';').indexOf(d) !== -1);
        }).length;

        var set_var = { 'cw': d, 'tokens': tokens };
        freqcols.forEach(function (x) {
            set_var[x] = d3.format('.3')(freqs[x])
        });
        return (set_var);
    });
    console.log(cwsFreq);

    cols = ['Feature', 'Tokens', ...freqcols];

    table = d3.select("#cwsFreq").append("table");
    table.append('thead').append('tr')
        .selectAll('th')
        .data(cols).enter()
        .append("th")
        .text(function (d) { return (d); });

    rows = table.append('tbody').selectAll('tr')
        .data(cwsFreq).enter()
        .append('tr');
    rows.selectAll('td')
        .data(function (d) {
            return (d3.keys(cwsFreq[0]).map(function (k) {
                return ({ 'name': k, 'value': d[k] });
            }));
        }).enter()
        .append('td')
        .attr('data-th', function (d) { return (d.name); })
        .text(function (d) { return (d.value); });

    $("table").DataTable({
        // 'destroy' : true,
        'order': [[1, 'desc']]
    });
}