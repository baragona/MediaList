function quotemeta (str) {
  return (str + '').replace(/([\.\\\+\*\?\[\^\]\$\(\)])/g, '\\$1');
}
function naturalSorter(as, bs){
    var a, b, a1, b1, i= 0, n, L,
    rx=/(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
    as=as+'';
    bs=bs+'';
    if(as=== bs) return 0;
    a= as.toLowerCase().match(rx);
    b= bs.toLowerCase().match(rx);
    L= a.length;
    while(i<L){
        if(!b[i]) return 1;
        a1= a[i],
        b1= b[i++];
        if(a1!== b1){
            n= a1-b1;
            if(!isNaN(n)) return n;
            return a1>b1? 1:-1;
        }
    }
    return b[i]? -1:0;
}
function displayFileSize(x){
    var str=0;
    if(x>0){
        var exp=Math.floor((Math.log(x*1.03)/Math.log(2))/10);
        var div=Math.pow(1024,exp);
        var str=(x/div);
        if(str<10){
            str=str.toFixed(1);
        }else{
            str=str.toFixed(0);
        }
        str=str+' '+(['B','kB','MB','GB','TB'])[exp];
    }
    return str;
}
function getWordsFromString(str){
    var matches= str.toLowerCase().match(/[a-z]+/g);
    if(matches){
        return matches;
    }
    return [];
}
var levenshtein = function(min, split){
    // Levenshtein Algorithm Revisited - WebReflection
    try{split=!("0")[0]}catch(i){split=true};
    return function(a, b){
        if(a == b)return 0;
        if(!a.length || !b.length)return b.length || a.length;
        if(split){a = a.split("");b = b.split("")};
        var len1 = a.length + 1,
            len2 = b.length + 1,
            I = 0,
            i = 0,
            d = [[0]],
            c, j, J;
        while(++i < len2)
            d[0][i] = i;
        i = 0;
        while(++i < len1){
            J = j = 0;
            c = a[I];
            d[i] = [i];
            while(++j < len2){
                d[i][j] = min(d[I][j] + 1, d[i][J] + 1, d[I][J] + (c != b[J]));
                ++J;
            };
            ++I;
        };
        return d[len1 - 1][len2 - 1];
    }
}(Math.min, false);
function startsWith(a,b){//does a start with b
    var re=new RegExp('^'+quotemeta(b),'i');
    if(a.match(re)){
        return true;
    }else{
        return false;
    }
}