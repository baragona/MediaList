interface SquishyStyle {
  'letter-spacing': string;
  'word-spacing': string;
  'margin-right': string;
  '-webkit-transform': string;
  '-webkit-transform-origin': string;
  'display': string;
  [key: string]: string;
}

interface TesterCache {
  [key: string]: number;
}

interface Tester {
  cache: TesterCache;
  testerDiv: HTMLDivElement;
  $div: JQuery<HTMLDivElement>;
  lastTesterStyles?: any;
  lastTesterClasses?: string[];
  lastTesterText?: string;
}

interface CurrentVals {
  text: string;
  width: number;
  fontSize: string;
}

const SquishyCache: Node[] = [];
const SquishyVals: CurrentVals[] = [];
const testers: { [key: string]: Tester } = {};

let calcSquishyHTML = function(
  text: string,
  fontSize: string,
  avail: number,
  classes: string[],
  doLogging?: number
): string {
  if (doLogging) {
    //console.log('avail = '+avail);
  }
  const useSubPixel = false;

  const mkSquishyStyle = function(
    letterSpacing: number,
    wordSpacing: number,
    chopPixels: number,
    targetWidth: number
  ): SquishyStyle {
    return {
      'letter-spacing': letterSpacing + 'px',
      'word-spacing': wordSpacing + 'px',
      'margin-right': '-' + chopPixels + 'px',
      '-webkit-transform': 'scale(' + (targetWidth / (chopPixels + targetWidth)) + ',1)',
      '-webkit-transform-origin': 'left top',
      'display': 'block'
    };
  };

  const flattenCSS = function(obj: { [key: string]: string }): string {
    const styleArr: string[] = [];
    for (const key in obj) {
      styleArr.push(key);
      styleArr.push(':');
      styleArr.push(obj[key]);
      styleArr.push(';');
    }
    return styleArr.join('');
  };

  const calculateWordDimensions = function(
    text: string,
    escape: boolean | undefined,
    styles: any,
    classes: string[],
    fontSize: string,
    purpose: string
  ): number {
    const cacheKey = function(text: string, classes: string[]): string {
      return text;
    };
    
    if (escape === undefined) {
      escape = true;
    }

    const testersKey = purpose + fontSize;

    let tester = testers[testersKey];
    if (!tester) {
      tester = {} as Tester;
      tester.cache = {};
      testers[testersKey] = tester;
      tester.testerDiv = document.createElement('div');
      document.body.appendChild(tester.testerDiv);
      tester.$div = $(tester.testerDiv);
    }

    if (purpose === 'analyze') {
      const hit = tester.cache[cacheKey(text, classes)];
      if (hit) {
        return hit;
      }
    }

    if (!_.isEqual(tester.lastTesterStyles, styles)) {
      const combined = $.extend({
        'position': 'absolute',
        'visibility': 'hidden',
        'height': 'auto',
        'width': 'auto',
        'white-space': 'nowrap'
      }, styles);

      tester.testerDiv.setAttribute('style', flattenCSS(combined));

      tester.lastTesterStyles = styles;
      if (doLogging) {
        //console.log(JSON.stringify(combined))
      }
    }
    
    if (!_.isEqual(tester.lastTesterClasses, classes)) {
      tester.$div.removeClass();
      if (classes) {
        _.each(classes, function(x) { tester.$div.addClass(x); });
      }
      tester.lastTesterClasses = classes;
    }
    
    if (text != tester.lastTesterText) {
      if (escape) {
        tester.testerDiv.textContent = text;
      } else {
        tester.testerDiv.innerHTML = text;
      }
      tester.lastTesterText = text;
    }

    const w = tester.testerDiv.offsetWidth;
    
    if (purpose === 'analyze') {
      tester.cache[cacheKey(text, classes)] = w;
    }
    return w;
  };

  let finished = false;
  let html = '';

  if (fontSize) {
    const quickSize = parseFloat(fontSize) * text.length;
    if (quickSize < 0.5 * avail) {
      html = _.escape(text);
      finished = true;
      if (doLogging) {
        //console.log("Obviously fits");
      }
    }
  }

  if (!finished) {
    const needed = calculateWordDimensions(text, true, {}, classes, fontSize, 'analyze');
    if (doLogging) console.log(needed + '   ' + avail);
    
    if (needed < avail) {
      html = _.escape(text);
    } else {
      let letterSpacing = 0;
      let wordSpacing = 0;

      const words = text.split(/\s+/);

      let letterBs = 0;
      _.each(words, function(x) { letterBs += x.length; });
      letterBs -= words.length;
      const wordBs = words.length - 1;
      
      const fontSizePx = parseFloat(fontSize);
      const globalMaxComp = 1 - Math.exp(-fontSizePx / 13);
      const maxLetterContraction = 1 * (fontSizePx / 13) * globalMaxComp;
      const maxWordContraction = 3 * (fontSizePx / 13) * globalMaxComp;
      const maxXScale = 0.2 * globalMaxComp;

      letterSpacing = _.max([-maxLetterContraction, -0.5 * (needed - avail) / letterBs]);
      if (!useSubPixel) letterSpacing = Math.round(letterSpacing);
      let adjustedNeeded = needed + 2 * letterSpacing * letterBs; //negative

      if (adjustedNeeded >= avail) {
        wordSpacing = _.max([-maxWordContraction, -1 * (adjustedNeeded - avail) / wordBs]);
        if (!useSubPixel) wordSpacing = Math.round(wordSpacing);
        adjustedNeeded += 1 * wordSpacing * wordBs; //negative
      }

      let chopAmt = calculateWordDimensions(
        text,
        true,
        mkSquishyStyle(letterSpacing, wordSpacing, 0, avail),
        classes,
        fontSize,
        'compensate'
      ) - avail;
      
      chopAmt += 0.001;
      chopAmt = _.min([chopAmt, maxXScale * avail]);

      return '<squishy style="' + 
        flattenCSS(mkSquishyStyle(letterSpacing, wordSpacing, chopAmt, avail)) +
        flattenCSS({
          'text-overflow': 'ellipsis',
          'overflow': 'hidden',
          'white-space': 'nowrap'
        }) + '">' + _.escape(text) + '</squishy>';
    }
    finished = true;
  }
  return html;
};

// Memoize the function
calcSquishyHTML = (window as any).memoize(calcSquishyHTML, { primitive: true });
(window as any).calcSquishyHTML = calcSquishyHTML;

function forceFitSquishy(
  Node: Node,
  text: string | undefined,
  classes: string[],
  fontSize: string
): void {
  const target = $(Node);

  if (text === undefined) {
    const sq = target.find('squishy');
    if (sq.length) {
      text = sq.text();
    } else {
      text = target.text();
    }
  }

  const currentVals: CurrentVals = {
    text: text,
    width: target.outerWidth() || 0,
    fontSize: fontSize
  };
  
  let foundIndex: number | undefined;
  let foundInCache = false;
  
  for (let i = 0; i < SquishyCache.length; i++) {
    const thisNode = SquishyCache[i];
    if (thisNode === Node) {
      const vals = SquishyVals[i];
      if (_.isEqual(vals, currentVals)) {
        //no work needs to be done
        return;
      } else {
        console.log(thisNode);
        console.log(JSON.stringify(vals) + JSON.stringify(currentVals));
        //invalidated
        foundInCache = true;
        foundIndex = i;
      }
    } else {
      continue;
    }
  }

  target.empty();
  const avail = target.width() || 0;

  target.html(calcSquishyHTML(text, fontSize, avail, classes));

  if (foundInCache && foundIndex !== undefined) {
    SquishyVals[foundIndex] = currentVals;
  } else {
    if (SquishyVals.length > 500) {
      //eject last one
      SquishyVals.shift();
      SquishyCache.shift();
    }

    SquishyVals.push(currentVals);
    SquishyCache.push(Node);
  }
}

// Export to global scope
(window as any).forceFitSquishy = forceFitSquishy;