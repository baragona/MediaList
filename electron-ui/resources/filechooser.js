function fileChooser(parent, getFilesInPath, initialPath){
    var columnbox=$('<div>').addClass('fileChooser').appendTo(parent);
    
    var columnDirs=initialPath.slice(0);
    var columns=[];
    var columnResizers=[];
    for(ci in columnDirs){
        var dir = makePathFromDirList(columnDirs.slice(0,ci*1+1));
        var highlight;
        highlight=columnDirs[ci*1+1];
        console.log(dir);
        columns[ci]=newFileColumn(columnbox,dir,highlight,columns,columnDirs,columnResizers,ci*1,getFilesInPath);
        
    }
}

function newFileColumn(parent,dir,highlight,columns,columnDirs,columnResizers,index,getFilesInPath){
    var column=$('<div>').addClass('fileColumn').addClass('sunken').appendTo(parent);
    
    column.click(function(e){
      if(e.target == column.get(0)){
          
      }
      
    });
    
    var columnDragging=false;
    var selected;
    getFilesInPath(dir,function(list){
        console.log(JSON.stringify(list));
        /*
        list=list.sort(function(a,b){
        
        });*/
        for(fi in list){
            (function(fi){
              var file=list[fi];
            
              var filediv = $('<div>').addClass('fileDiv').text(file.name).appendTo(column);
              file.filediv=filediv;
              if(file.type=='dir'){
                  filediv.addClass('fileDirectory');
              }else if(file.type=='file'){
                  filediv.addClass('fileFile');
              }else if(file.type=='app'){
                  filediv.addClass('fileApp');
              }
            
              if(file.name == highlight){
                  filediv.addClass('fileSelected');
                  selected = file;
              }
             var handler = function(e){
                  if( e.type =='mouseup' || e.which!=1){
                      columnDragging=false;
                  }
                  if(e.type=='mousemove'  && !columnDragging){
                      return;
                  }
                  if(e.type=='mousedown'){
                      columnDragging=true;
                  }
                  if(file!=selected){
                      if(selected) {
                          selected.filediv.removeClass('fileSelected');
                      }
                      filediv.addClass('fileSelected');
                      selected = file;
                      
                      //delete all columns to the right of this one
                      columnDirs.splice(index+1);
                      
                      
                      _.each(columns.splice(index+1),function(x){
                          //alert(x);
                          x.detach();
                      });
                      _.each(columnResizers.splice(index+1),function(x){
                          //alert(x);
                          x.detach();
                      });
                      
                      columnDirs[index+1] = selected.name;
                      if(selected.type == 'dir'){
                          var dir = makePathFromDirList(columnDirs);
                          console.log(dir);
                          columns[index+1]=newFileColumn(parent,dir,undefined,columns,columnDirs,columnResizers,index+1,getFilesInPath);
                      }
                      
                  }
              };
              filediv.on("mousedown mouseup mousemove",handler);
            })(fi);
        }
    });
    
    var resizer = $('<div>').addClass('fileColumnResizer');
    column.after(resizer);
    columnResizers[index]=resizer;
    
    resizer.mousedown(function(e){
        var initWidth = column.width();
        var moveH = function(eM){
            if(e.which != 1){
                $('body').off('mousemove', moveH);
            }
            column.width(initWidth+eM.pageX-e.pageX);
        };
        $('body').on('mousemove', moveH);
        $('body').mouseup(function(){
            $('body').off('mousemove', moveH);
        });
    });
    
    
    return column;
}


function makePathFromDirList(dirs){
        dirs=dirs.slice(0);
        dirs.shift();
        return '/'+dirs.join('/');
}

function newFileDiv(){
    
}

