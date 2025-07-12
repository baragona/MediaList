/// <reference path="types/globals.d.ts" />
/// <reference path="types/slickgrid.d.ts" />
/// <reference path="types/custom-libs.d.ts" />
/// <reference path="types/window.d.ts" />

// Declare Slick as a global to avoid window access
declare const Slick: typeof window.Slick;

// Initialize variables
const apiBase = "http://localhost:43590/";
let library: LibraryItem[] = [];
let keyWordsToCount: { [key: string]: number } = {};
let grid: Slick.Grid<LibraryItem>;
let dataView: Slick.DataView<LibraryItem>;
// let resizeTimeout: number; // Unused variable
let availableWidth: number;
let availableHeight: number;
let rowHeight = 15;
let gridFontSize: string = "12px";
let configEditorOpen = false;
let searchStringToRegex: { [key: string]: RegExp } = {};

const $window = $(window);

// Set up search box
const searchSpan = $("<span>");
searchSpan.css("position", "relative");
const searchClear = $(
  '<img style="position:absolute; right:2px; top:2px;cursor:pointer" src="win95icons/Xbutton.png" alt="" />'
);
searchClear.hide();
searchClear.click(function () {
  $("#searchBox").val("");
  $("#searchBox").change();
});
$("#searchBox").wrap(searchSpan).after(searchClear);

function focusSearchBox() {
  const searchBox = $("#searchBox").get(0);
  if (searchBox) {
    searchBox.focus();
  }
}

$("#searchBox").blur(function () {
  if (shouldSearchBoxStayFocused()) {
    focusSearchBox();
  }
});
focusSearchBox();

function shouldSearchBoxStayFocused() {
  if ($(".ui-dialog").length) {
    return false;
  }
  return true;
}

$("#searchBox").keydown(function (e) {
  if (e.which === 38 || e.which === 40) {
    e.preventDefault();
    if (grid) {
      grid.getFocusSink().trigger(e);
    }
  }
});

$("#editConfigButton").click(openConfigEditor);

$("#scanFilesButton").click(async function() {
  const button = $(this);
  const originalText = button.html();
  
  // Disable button and show scanning state
  button.prop('disabled', true);
  button.html('<img src="win95icons/Icon_28-0.png" style="width: 16px; height: 16px" /> Scanning...');
  
  showNotification('Starting file scan...', 'info');
  
  try {
    const response = await fetch(apiBase + 'scanFiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification(result.message, 'success');
      // Refresh the library display
      await refreshLibrary();
    } else {
      showNotification(result.error || 'Scan failed', 'error');
    }
  } catch (error) {
    console.error('Scan error:', error);
    showNotification('Error during scan: ' + (error as Error).message, 'error');
  } finally {
    // Re-enable button and restore original text
    button.prop('disabled', false);
    button.html(originalText);
  }
});

$("#zoomSlider").slider({
  value: 15,
  min: 10,
  max: 25,
  step: 0.5,
  slide: _.throttle(function (event: Event, ui: { value: number }) {
    setRowSize(ui.value);
  }, 30),
});

// Calculate size function
const calculateSize = function () {
  const offset = $("#grid").offset()!;
  availableWidth = $window.width() - offset.left - 100;
  availableHeight = $window.height() - offset.top - 10;
  $("#grid").css("height", availableHeight + "px");
  if (grid && grid.resizeCanvas) {
    grid.resizeCanvas();
  }
};
$window.on("resize", calculateSize);

function objectToQueryString(obj: { [key: string]: any }): string {
  return "?" + new URLSearchParams(obj).toString();
}

function closestMatchInDictionary(word: string, keyWordsToCount: { [key: string]: number }, maxErrors: number): string {
  if (keyWordsToCount[word]) {
    return word;
  }
  const keys = _.keys(keyWordsToCount);
  const matches = _.filter(keys, function (el) {
    return startsWith(el, word);
  });
  if (matches.length > 0) {
    if (matches.length === 1) {
      return matches[0];
    } else {
      return word;
    }
  }

  const goodLengths = _.filter(keys, function (el) {
    if (el.length >= word.length - maxErrors) {
      return true;
    }
  });

  return _.min(goodLengths, function (el) {
    return levenshtein(el, word);
  });
}

function setRowSize(newsize: number) {
  rowHeight = newsize;
  gridFontSize = Math.round(newsize * 0.8) + "px";
  jss(".slick-cell", { fontSize: gridFontSize });

  const oldTopRow = grid.getViewport().top;

  initSlickGrid();

  grid.scrollRowToTop(oldTopRow);
}

// Initialize DataView
dataView = new Slick.Data.DataView();
dataView.onRowCountChanged.subscribe(function (e, args) {
  grid.updateRowCount();
  grid.render();
});

dataView.onRowsChanged.subscribe(function (e, args) {
  grid.invalidateRows(args.rows);
  grid.render();
});

$("#searchBox").on("keyup change", function () {
  dataView.refresh();

  if ($("#searchBox").val()) {
    searchClear.show();
  } else {
    searchClear.hide();
  }
});

dataView.setFilter(function (item: LibraryItem) {
  let current = item["path"];

  current = current.replace(/[^\w\d]+/gi, " ");

  const search = $("#searchBox").val() as string;
  let re: RegExp;
  if (searchStringToRegex[search]) {
    re = searchStringToRegex[search];
  } else {
    const words = getWordsFromString(search);
    const mappedWords = words
      .map(function (x) {
        return closestMatchInDictionary(
          x,
          keyWordsToCount,
          Math.ceil(x.length / 3.0)
        );
      })
      .join(" ");
    re = new RegExp("([^\\w\\d]|^)" + quotemeta(mappedWords), "i");
    searchStringToRegex[search] = re;
  }
  if (current.match(re)) {
    return true;
  } else {
    return false;
  }
});

function initSlickGrid() {
  $("#grid").empty();
  $("#grid").removeClass();
  grid = undefined!;
  const columns: Slick.Column<LibraryItem>[] = [
    {
      id: "name",
      name: "Name",
      field: "basename",
      sortable: true,
      formatter: function (row, cell, value, columnDef, dataContext) {
        const doLogging = row === 0;
        return calcSquishyHTML(
          value,
          gridFontSize,
          columnDef.width!,
          ["ui-widget", "slick-cell"],
          doLogging
        );
      },
    },
    {
      id: "size",
      name: "Size",
      field: "size",
      sortable: true,
      formatter: function (row, cell, value, columnDef, dataContext) {
        return displayFileSize(value);
      },
    },
  ];

  const options: Slick.GridOptions<LibraryItem> = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    forceFitColumns: true,
    fullWidthRows: true,
    rowHeight: rowHeight,
    editable: true,
    multiSelect: true,
    forceSyncScrolling: false,
    syncColumnCellResize: true,
  };

  grid = new Slick.Grid("#grid", dataView, columns, options);
  grid.setSelectionModel(
    new Slick.RowSelectionModel({ dragToMultiSelect: true })
  );

  grid.onDblClick.subscribe(function (e, args) {
    const cell = grid.getCellFromEvent(e);
    const fileId = dataView.getItem(cell.row).id;
    fetch(apiBase + "openFile" + objectToQueryString({ fileId: fileId }));
  });

  grid.init();
  calculateSize();

  grid.onSort.subscribe(function (e, args) {
    const comparer = function (a: LibraryItem, b: LibraryItem) {
      const field = args.sortCol.field as keyof LibraryItem;
      return naturalSorter(String(a[field]), String(b[field]));
    };

    // Delegate the sorting to DataView.
    dataView.sort(comparer, args.sortAsc);
  });

  grid.onColumnsResized.subscribe(function (e, args) {
    grid.invalidateAllRows();
    grid.render();
  });
}

initSlickGrid();
setRowSize(rowHeight);

// Load library data
(async function () {
  const libraryResult = await fetch(apiBase + "getLibrary");
  library = await libraryResult.json();
  keyWordsToCount = _.countBy(
    _.flatten(
      library.map(function (x) {
        return getWordsFromString(x.path);
      })
    ),
    function (x) {
      return x;
    }
  );

  dataView.beginUpdate();
  dataView.setItems(library);
  dataView.endUpdate();
})();

// Notification system
function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const notification = $('#notification');
  notification.text(message);
  
  // Set colors based on type
  if (type === 'success') {
    notification.css({
      'background-color': '#d4edda',
      'color': '#155724',
      'border': '1px solid #c3e6cb'
    });
  } else if (type === 'error') {
    notification.css({
      'background-color': '#f8d7da',
      'color': '#721c24',
      'border': '1px solid #f5c6cb'
    });
  } else {
    notification.css({
      'background-color': '#d1ecf1',
      'color': '#0c5460',
      'border': '1px solid #bee5eb'
    });
  }
  
  notification.fadeIn();
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    notification.fadeOut();
  }, 4000);
}

// Drag and drop functionality
let dragCounter = 0;

$(document).on('dragenter', function(e) {
  e.preventDefault();
  dragCounter++;
  $('body').css('background-color', 'rgba(0,123,255,0.05)');
});

$(document).on('dragleave', function(e) {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    $('body').css('background-color', '');
  }
});

$(document).on('dragover', function(e) {
  e.preventDefault();
});

$(document).on('drop', async function(e) {
  e.preventDefault();
  dragCounter = 0;
  $('body').css('background-color', '');
  
  const files = (e.originalEvent as DragEvent).dataTransfer!.files;
  
  if (files.length === 0) {
    showNotification('No files dropped', 'error');
    return;
  }
  
  showNotification(`Processing ${files.length} file(s)...`, 'info');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = (file as FileWithPath).path;
    
    try {
      const response = await fetch(apiBase + 'addFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: filePath })
      });
      
      const result = await response.json();
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        console.error(`Failed to add ${file.name}: ${result.error}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`Error adding ${file.name}:`, error);
    }
  }
  
  // Show final notification
  if (successCount > 0 && errorCount === 0) {
    showNotification(`Successfully added ${successCount} file(s) to library`, 'success');
    // Refresh the library display
    await refreshLibrary();
  } else if (successCount > 0 && errorCount > 0) {
    showNotification(`Added ${successCount} file(s), failed to add ${errorCount} file(s)`, 'error');
    await refreshLibrary();
  } else {
    showNotification(`Failed to add all ${errorCount} file(s)`, 'error');
  }
});

// Function to refresh the library display
async function refreshLibrary() {
  try {
    const libraryResult = await fetch(apiBase + "getLibrary");
    library = await libraryResult.json();
    keyWordsToCount = _.countBy(
      _.flatten(
        library.map(function (x) {
          return getWordsFromString(x.path);
        })
      ),
      function (x) {
        return x;
      }
    );
    
    dataView.beginUpdate();
    dataView.setItems(library);
    dataView.endUpdate();
  } catch (error) {
    console.error('Error refreshing library:', error);
    showNotification('Error refreshing library display', 'error');
  }
}

async function openConfigEditor() {
  if (configEditorOpen) {
    return;
  } else {
    configEditorOpen = true;
  }
  const resp = await fetch(apiBase + "getConfigSchemaJSON");
  const respText = await resp.text();
  const json = JSON.parse(respText);
  const dialog = $('<div  title="Configuration">');
  const jsonform = $("<div >");
  dialog.append(jsonform);
  const reclaimer = kosherForm(json, jsonform);

  dialog.dialog({
    autoOpen: true,
    width: "auto",
    height: "auto",
    position: {
      my: "center",
      at: "center",
      of: window,
    },
    close: function () {
      dialog.dialog("destroy");
      dialog.detach();
      configEditorOpen = false;

      focusSearchBox();
    },
    buttons: {
      Save: function () {
        (async function () {
          const json = JSON.stringify(reclaimer(), undefined, 2);

          dialog.dialog("close");

          const onError = function () {
            alert("BAD");
          };

          const params = { newConfigJSON: json };
          const saveResult = await fetch(
            apiBase + "saveConfig" + objectToQueryString(params)
          );
          const saveResultText = await saveResult.text();
          if (saveResultText !== "saved") {
            onError();
          }
        })();
      },
    },
  });
  dialog
    .parent()
    .find(".ui-dialog-title")
    .prepend(
      '<img src="win95icons/Icon_22-0.png" style="vertical-align: middle;">'
    );
}