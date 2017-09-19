$(function() {

  //used for redrawing upon resize
  var throttleTimer;
  var plotContainerId = 'plot-container';
  var dataSelector = 'data-selector';
  var totalWidth = $('#' + plotContainerId).width();
  var totalHeight = $(window).height() - $('#' + plotContainerId).offset().top;

  // used to maintain the main frame container
  var frame = new Frame(plotContainerId, totalWidth, totalHeight);

  // Act upon json reload
  $('#' + dataSelector).on('rendered.bs.select', event => {
    d3.json($('#' + dataSelector).val(), dataInput => {
      frame.dataInput = dataInput;
      frame.render();
    });
  });

  d3.queue()
    .defer(d3.json, './data.json')
    .defer(d3.json, './metadata.json')
    .awaitAll((error, results) => {
      if (error) throw error;
      frame.dataInput = results[0];
      frame.dataInput.metadata = results[1].metadata;
      frame.dataInput.genes = [];
      frame.render();
  });

  d3.queue()
    .defer(d3.json, './genes.json')
    .awaitAll((error, results) => {
      if (error) throw error;
      frame.dataInput.genes = results[0].genes;
      frame.render();
  });

  // Act upon window resize
  d3.select(window).on('resize', () => {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(() => {
      totalWidth = $('#' + plotContainerId).width();
      totalHeight = $(window).height() - $('#' + plotContainerId).offset().top;
      frame.updateDimensions(totalWidth, totalHeight);
      frame.render();
    }, 200);
  });

  $('#gene-checkbox').on('click', (event) => {
    frame.margins.panels.upperGap = $('#gene-checkbox').is(":checked") ? 
      frame.margins.defaults.upperGapPanelWithGenes : 
      frame.margins.defaults.upperGapPanel;
    frame.toggleGenesPanel()
  });


  // Start file download.
  document.getElementById("download-button").addEventListener("click", function(){
      // Generate download of file with the elements in the current panels
    let text = document.getElementById("fragmentsDetails").innerHTML;
    let filename = "export.txt";

    download(filename, text);
  }, false);

  // Execute the delete operation
  $('html').keyup((e) => {
    if ((e.keyCode === 46) || (e.keyCode === 8)) {
      frame.runDelete();
    }
  });

  // Remove any other open popovers
  $(document).on('mousemove', (event) => {
    if (!$(event.target).is('.popovered')) {
      frame.clearPopovers();
    }
  });

  $('#fragmentsNote').tooltip({trigger: 'manual'});
  
  $('#fragmentsNote').on('click', (event) => {
    event.preventDefault();
    var textArea = document.createElement("textarea");

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';

    textArea.value = d3.select('#fragmentsNote').text();

    document.body.appendChild(textArea);

    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      $('#fragmentsNote').tooltip('show');
      setTimeout(function() {
        $('#fragmentsNote').tooltip('hide');
      }, 1000);
    } catch (err) {
      console.log('Oops, unable to copy');
    }

    document.body.removeChild(textArea);
  });

  function download(filename, text) {
    let element = document.getElementById("downloadLink");
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';

    element.click();
  };
});

