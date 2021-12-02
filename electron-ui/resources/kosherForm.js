function kosherForm(schema,parent){
    var table = $('<table>').appendTo(parent);
    table.addClass('kosherForm');
    //table.append($('<pre>').text(JSON.stringify(schema,undefined, 2)));
    
    var reclaimers={};
    
    for (ki in schema.order){
        var key = schema.order[ki];
        
        var row = $('<tr>').addClass('kosherPropertyRow').appendTo(table);
        
        var props = schema.properties[key];
        
        var iconbox = $('<td>').appendTo(row);
        if(props.icon){
            iconbox.append('<img src="'+props.icon+'">');
        }
        var label = $('<td>').text(props.title+':').addClass('kosherPropertyLabel').appendTo(row);
        
        var editbox = $('<td>').appendTo(row);
        
        reclaimers[key]=makeKosherPropertyEditor(props,props.default,editbox);
        
    }
    
    return function(){
        var output={};
        for (key in reclaimers){
            output[key]=reclaimers[key]();
        }
        return output;
    };
}

function makeKosherPropertyEditor(props,def,editbox){
        if(props.type == 'string'){
            var input = $('<input type="text">').appendTo(editbox);
            input.val(def);
            return function(){
                return input.val();
            };
        }else if(props.type == 'number'){
            var input = $('<input type="text">').appendTo(editbox);
            input.val(def);
            return function(){
                return parseInt(input.val());
            };
        }else if(props.type == 'array'){
            var table = $('<table>').addClass('kosherForm').appendTo(editbox);
            
            var reclaimers=[];
            
            for (i in def){
                reclaimers.push(makeKosherArrayRow(table,props,def[i],reclaimers));
                
            }
            var addButton = $('<button>').text('Add').addClass('kosherAddButton').appendTo(editbox);
            
            addButton.click(function(){
                reclaimers.push(makeKosherArrayRow(table,props,undefined,reclaimers));
            });
            return function(){
                return reclaimers.map(function(x){return x();});
            };
        }
}

function makeKosherArrayRow(table,props,def,reclaimers){
    var row = $('<tr>').appendTo(table);
    var innerEditbox=$('<td>').appendTo(row);
    
    var reclaimer = makeKosherPropertyEditor(props.items,def,innerEditbox);
  
    var deleteCell=$('<td>').appendTo(row);
    var deleteButton=$('<button>').text('X').addClass('kosherDeleteButton').appendTo(deleteCell);
  
    deleteButton.click(function(){
        row.detach();
        
        for(ri in reclaimers){
            if(reclaimers[ri]==reclaimer){
                reclaimers.splice(ri,1);
            }
        }
        
    });
    
    return reclaimer;
}

/*
<pre>{
  "order": [
    "LibraryRoots",
    "VideoFileExtensions",
    "AudioFileExtensions",
    "MaxSearchDepth",
    "MinMovieSize",
    "MinAudioSize"
  ],
  "properties": {
    "AudioFileExtensions": {
      "default": [],
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Audio File Extensions"
    },
    "MinAudioSize": {
      "default": [],
      "type": "number",
      "title": "Min Audio Size"
    },
    "VideoFileExtensions": {
      "default": [
        "avi",
        "mp4",
        "mkv",
        "m4v"
      ],
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Video File Extensions"
    },
    "MaxSearchDepth": {
      "default": 7,
      "type": "number",
      "title": "Max Search Depth"
    },
    "LibraryRoots": {
      "default": [
        "/Volumes/Data"
      ],
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Library Roots"
    },
    "MinMovieSize": {
      "default": 52428800,
      "type": "number",
      "title": "Min Movie Size"
    }
  }
}</pre>*/

