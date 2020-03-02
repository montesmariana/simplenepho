const { dialog, app } = require("electron").remote;
const fs = require("fs");
const path = require("path");
const userDataPath = app.getPath('userData');

function openCloud() {
    const cloudFile = dialog.showOpenDialogSync(options = {
        title: "Upload your cloud"
    });
    const dataset = d3.tsvParse(fs.readFileSync(cloudFile[0],
        options = { encoding: 'utf-8' }));
    const type = path.basename(cloudFile[0], '.tsv');
    execute(dataset, type, 'model');
}
function openFrequency() {
    const cwsFile = path.join(userDataPath, 'cws_selection.json');
    const cwsData = JSON.parse(fs.readFileSync(cwsFile, options = {encoding : 'utf-8'}));
    const freqFile = dialog.showOpenDialogSync(options = {
        title : "Select a frequency file"
    });
    const freqData = d3.tsvParse(fs.readFileSync(freqFile[0], options = {encoding : 'utf-8'}));
    execute([null, freqData], cwsData);
}