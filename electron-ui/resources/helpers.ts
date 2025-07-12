function quotemeta(str: string): string {
  return (str + '').replace(/([\.\\\+\*\?\[\^\]\$\(\)])/g, '\\$1');
}

function naturalSorter(as: string | number, bs: string | number): number {
  const rx = /(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
  const asStr = as + '';
  const bsStr = bs + '';
  
  if (asStr === bsStr) return 0;
  
  const a = asStr.toLowerCase().match(rx);
  const b = bsStr.toLowerCase().match(rx);
  
  if (!a || !b) return 0;
  
  const L = a.length;
  let i = 0;
  
  while (i < L) {
    if (!b[i]) return 1;
    const a1 = a[i];
    const b1 = b[i++];
    
    if (a1 !== b1) {
      const n = Number(a1) - Number(b1);
      if (!isNaN(n)) return n;
      return a1 > b1 ? 1 : -1;
    }
  }
  
  return b[i] ? -1 : 0;
}

function displayFileSize(x: number): string {
  if (x <= 0) return '0';
  
  const exp = Math.floor((Math.log(x * 1.03) / Math.log(2)) / 10);
  const div = Math.pow(1024, exp);
  let str = x / div;
  
  if (str < 10) {
    return str.toFixed(1) + ' ' + (['B', 'kB', 'MB', 'GB', 'TB'])[exp];
  } else {
    return str.toFixed(0) + ' ' + (['B', 'kB', 'MB', 'GB', 'TB'])[exp];
  }
}

function getWordsFromString(str: string): string[] {
  const matches = str.toLowerCase().match(/[a-z]+/g);
  return matches || [];
}

const levenshtein = (function(min: typeof Math.min, split: boolean) {
  // Levenshtein Algorithm Revisited - WebReflection
  try {
    split = !("0" as unknown as string[])[0];
  } catch (i) {
    split = true;
  }
  
  return function(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length || !b.length) return b.length || a.length;
    
    const aArr: string[] = split ? a.split("") : Array.from(a);
    const bArr: string[] = split ? b.split("") : Array.from(b);
    
    const len1 = aArr.length + 1;
    const len2 = bArr.length + 1;
    let I = 0;
    let i = 0;
    const d: number[][] = [[0]];
    
    while (++i < len2) {
      d[0][i] = i;
    }
    
    i = 0;
    while (++i < len1) {
      let J = 0;
      let j = 0;
      const c = aArr[I];
      d[i] = [i];
      
      while (++j < len2) {
        d[i][j] = min(
          d[I][j] + 1,
          d[i][J] + 1,
          d[I][J] + (c !== bArr[J] ? 1 : 0)
        );
        ++J;
      }
      ++I;
    }
    
    return d[len1 - 1][len2 - 1];
  };
})(Math.min, false);

function startsWith(a: string, b: string): boolean {
  const re = new RegExp('^' + quotemeta(b), 'i');
  return re.test(a);
}