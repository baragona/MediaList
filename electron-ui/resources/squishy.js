var SquishyCache=[];
var SquishyVals =[];



var testers={};

var calcSquishyHTML = function(text,fontSize,avail,classes, doLogging){
    if(doLogging){
        //console.log('avail = '+avail);
    }
    var useSubPixel=false;
    
    var mkSquishyStyle =function (letterSpacing,wordSpacing,chopPixels,targetWidth){
        return {
            'letter-spacing':letterSpacing+'px',
            'word-spacing':wordSpacing+'px',
            'margin-right':'-'+chopPixels+'px',
            '-webkit-transform':'scale('+(targetWidth/(chopPixels+targetWidth))+',1)',
            '-webkit-transform-origin':'left top',
            'display':'block'
        };
    };
    var flattenCSS = function(obj){
        var styleArr=[];
        for (key in obj){
            styleArr.push(key);
            styleArr.push(':');
            styleArr.push(obj[key]);
            styleArr.push(';');
        }
        return styleArr.join('');
    };
    var calculateWordDimensions = function (text, escape,styles,classes,fontSize,purpose){
          var cacheKey = function(text,classes){
                return text;
          }
          if (escape === undefined) {
              escape = true;
          }
          
          var testersKey=purpose+fontSize;
          
          var tester=testers[testersKey];
          if(! tester){
              /*
              tester = {
                  lastTesterStyles:undefined;
                  lastTesterClasses:undefined;
                  lastTesterText:undefined;
                  testerDiv:undefined;
                  $div:undefined;
              };*/
              tester={};
              tester.cache={};
              testers[testersKey]=tester;
              tester.testerDiv=document.createElement('div');
              document.body.appendChild(tester.testerDiv);
              tester.$div=$(tester.testerDiv);
          }
          
          if(purpose=='analyze'){
              var hit = tester.cache[cacheKey(text,classes)];
              if(hit){
                  return hit;
              }
          }
          
          if(! _.isEqual(tester.lastTesterStyles,styles)){
                var combined = $.extend({'position':'absolute','visibility':'hidden',
                    'height':'auto','width':'auto',
                    'white-space':'nowrap'},styles);

                tester.testerDiv.setAttribute('style', flattenCSS(combined));
                
                tester.lastTesterStyles=styles;
                if(doLogging){
                //console.log(JSON.stringify(combined))
                }
          }
          if(! _.isEqual(tester.lastTesterClasses,classes)){
              tester.$div.removeClass();
              if(classes){
                  _.each(classes,function(x){tester.$div.addClass(x)});
              }
              tester.lastTesterClasses=classes;
          }
          if(text != tester.lastTesterText){
              if (escape) {
                  tester.testerDiv.textContent = text;
              } else {
                  tester.testerDiv.innerHTML = text;
              }
              tester.lastTesterText = text;
          }

          //document.body.appendChild(tester.testerDiv);

          //w = tester.$div.outerWidth();
          w = tester.testerDiv.offsetWidth;
          //tester.testerDiv.parentNode.removeChild(testerDiv);
          if(purpose=='analyze'){
              tester.cache[cacheKey(text,classes)]=w;
          }
          return w;
    };
    var finished=false;
    
    var html;
    
    if(fontSize){
        var quickSize = parseFloat(fontSize)*text.length;
        if(quickSize < .5*avail){
            html=_.escape(text);
            finished=true;
            if(doLogging){
                //console.log("Obviously fits");
            }
        }
    }

    if(!finished){
        var needed = calculateWordDimensions(text,true,{},classes,fontSize,'analyze');
        if(doLogging)console.log(needed+'   '+avail);
        if(needed<avail){
            html=_.escape(text);
        }else{
            var letterSpacing=0;
            var wordSpacing=0;
    
            var words=text.split(/\s+/);
    
            var letterBs=0;
            _.each(words,function(x){letterBs+=x.length});
            letterBs -= words.length;
            var wordBs = words.length-1;
            //console.log(letterBs);
            //console.log(wordBs);
            var fontSizePx = parseFloat(fontSize);      
            var globalMaxComp = 1-Math.exp(-fontSizePx/13);
            var maxLetterContraction = 1*(fontSizePx/13)*globalMaxComp;
            var maxWordContraction = 3*(fontSizePx/13)*globalMaxComp;
            var maxXScale = .2*globalMaxComp;
            
  
            letterSpacing = _.max([-maxLetterContraction,-0.5*(needed-avail)/letterBs]);
            if(!useSubPixel) letterSpacing = Math.round(letterSpacing);
            needed += 2*letterSpacing*letterBs;//negative
    
            if(needed>=avail){
              wordSpacing = _.max([-maxWordContraction,-1*(needed-avail)/wordBs]);
              if(!useSubPixel) wordSpacing = Math.round(wordSpacing);
              needed += 1*wordSpacing*wordBs;//negative
            }
    
            var chopAmt=calculateWordDimensions(text,true,mkSquishyStyle(letterSpacing,wordSpacing,0,avail),classes,fontSize,'compensate')-avail;
            //var chopAmt = 0.001+needed-avail;
            //chopAmt=Math.ceil(chopAmt);
            chopAmt += 0.001;
            chopAmt = _.min([chopAmt, maxXScale*avail]);
    
    /*
            var wrapper=$('<squishy>');
            wrapper.text(text);
            wrapper.css(mkSquishyStyle(letterSpacing,wordSpacing,chopAmt,avail));
            wrapper.css({'text-overflow':'ellipsis','overflow': 'hidden','white-space': 'nowrap'});
            //target.append(wrapper);
            html=wrapper[0].outerHTML;
            //console.log(html);
    */
            
            return '<squishy style="'+flattenCSS(mkSquishyStyle(letterSpacing,wordSpacing,chopAmt,avail))+flattenCSS({'text-overflow':'ellipsis','overflow': 'hidden','white-space': 'nowrap'})+'">'+_.escape(text)+'</squishy>';
        }
        finished=true;
    }
    return html;
};

calcSquishyHTML = memoize(calcSquishyHTML, { primitive: true });

function forceFitSquishy(Node,text,classes,fontSize){

    var target=$(Node);




    if(text==undefined){
        var sq=target.find('squishy');
        if (sq.length){
            text = sq.text();
        }else{
            text = target.text();
        }
    }
  
    var currentVals = {text:text, width:target.outerWidth(), fontSize:fontSize};
    var foundIndex;
    var foundInCache=false;
    for (i in SquishyCache){
        var thisNode=SquishyCache[i];
        if(thisNode === Node){
            var vals = SquishyVals[i];
            if(_.isEqual(vals,currentVals)){
                //no work needs to be done
                //console.log('DUN');
                return;
            }else{
                console.log(thisNode);
                console.log(JSON.stringify(vals)+JSON.stringify(currentVals));
                //invalidated
                foundInCache=true;
                foundIndex=i;
            }
        }else{
            continue;
        }
    }

    

    target.empty();
    var avail = target.width();
    
    target.html(calcSquishyHTML(text,fontSize,avail,classes));
    
    if(foundInCache){
        SquishyVals[foundIndex]=currentVals;
    }else{
        if(SquishyVals.length>500){
          //eject last one
          SquishyVals.shift();
          SquishyCache.shift();
        }
        
        SquishyVals.push(currentVals);
        SquishyCache.push(Node);
    }
}
