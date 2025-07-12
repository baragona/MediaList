interface FileInfo {
  name: string;
  type: 'dir' | 'file' | 'app';
  filediv?: JQuery;
}

type GetFilesCallback = (list: FileInfo[]) => void;
type GetFilesInPath = (path: string, callback: GetFilesCallback) => void;

function fileChooser(
  parent: JQuery,
  getFilesInPath: GetFilesInPath,
  initialPath: string[]
): void {
  const columnbox = $('<div>').addClass('fileChooser').appendTo(parent);

  const columnDirs = initialPath.slice(0);
  const columns: JQuery[] = [];
  const columnResizers: JQuery[] = [];
  
  for (let ci = 0; ci < columnDirs.length; ci++) {
    const dir = makePathFromDirList(columnDirs.slice(0, ci + 1));
    const highlight = columnDirs[ci + 1];
    console.log(dir);
    columns[ci] = newFileColumn(
      columnbox,
      dir,
      highlight,
      columns,
      columnDirs,
      columnResizers,
      ci,
      getFilesInPath
    );
  }
}

function newFileColumn(
  parent: JQuery,
  dir: string,
  highlight: string | undefined,
  columns: JQuery[],
  columnDirs: string[],
  columnResizers: JQuery[],
  index: number,
  getFilesInPath: GetFilesInPath
): JQuery {
  const column = $('<div>').addClass('fileColumn').addClass('sunken').appendTo(parent);

  column.click(function(e) {
    if (e.target == column.get(0)) {
      // Column background clicked
    }
  });

  let columnDragging = false;
  let selected: FileInfo | undefined;
  
  getFilesInPath(dir, function(list: FileInfo[]) {
    console.log(JSON.stringify(list));
    
    for (let fi = 0; fi < list.length; fi++) {
      (function(fi: number) {
        const file = list[fi];

        const filediv = $('<div>').addClass('fileDiv').text(file.name).appendTo(column);
        file.filediv = filediv;
        
        if (file.type === 'dir') {
          filediv.addClass('fileDirectory');
        } else if (file.type === 'file') {
          filediv.addClass('fileFile');
        } else if (file.type === 'app') {
          filediv.addClass('fileApp');
        }

        if (file.name === highlight) {
          filediv.addClass('fileSelected');
          selected = file;
        }
        
        const handler = function(e: JQuery.Event) {
          if (e.type === 'mouseup' || e.which !== 1) {
            columnDragging = false;
          }
          if (e.type === 'mousemove' && !columnDragging) {
            return;
          }
          if (e.type === 'mousedown') {
            columnDragging = true;
          }
          if (file !== selected) {
            if (selected && selected.filediv) {
              selected.filediv.removeClass('fileSelected');
            }
            filediv.addClass('fileSelected');
            selected = file;

            // Delete all columns to the right of this one
            columnDirs.splice(index + 1);

            _.each(columns.splice(index + 1), function(x) {
              x.detach();
            });
            _.each(columnResizers.splice(index + 1), function(x) {
              x.detach();
            });

            columnDirs[index + 1] = selected.name;
            if (selected.type === 'dir') {
              const newDir = makePathFromDirList(columnDirs);
              console.log(newDir);
              columns[index + 1] = newFileColumn(
                parent,
                newDir,
                undefined,
                columns,
                columnDirs,
                columnResizers,
                index + 1,
                getFilesInPath
              );
            }
          }
        };
        filediv.on("mousedown mouseup mousemove", handler);
      })(fi);
    }
  });

  const resizer = $('<div>').addClass('fileColumnResizer');
  column.after(resizer);
  columnResizers[index] = resizer;

  resizer.mousedown(function(e) {
    const initWidth = column.width() || 0;
    const moveH = function(eM: JQuery.MouseMoveEvent) {
      if (e.which !== 1) {
        $('body').off('mousemove', moveH);
      }
      column.width(initWidth + eM.pageX - e.pageX);
    };
    $('body').on('mousemove', moveH);
    $('body').mouseup(function() {
      $('body').off('mousemove', moveH);
    });
  });

  return column;
}

function makePathFromDirList(dirs: string[]): string {
  const dirsCopy = dirs.slice(0);
  dirsCopy.shift();
  return '/' + dirsCopy.join('/');
}

function newFileDiv(): void {
  // Not implemented in original
}