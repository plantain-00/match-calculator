!function(e){var n={};function r(t){if(n[t])return n[t].exports;var o=n[t]={i:t,l:!1,exports:{}};return e[t].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=n,r.d=function(e,n,t){r.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:t})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,n){if(1&n&&(e=r(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(r.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var o in e)r.d(t,o,function(n){return e[n]}.bind(null,o));return t},r.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(n,"a",n),n},r.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},r.p="",r(r.s=0)}([function(e,n,r){"use strict";r.r(n);function t(e){var n="function"==typeof Symbol&&e[Symbol.iterator],r=0;return n?n.call(e):{next:function(){return e&&r>=e.length&&(e=void 0),{value:e&&e[r++],done:!e}}}}function o(e,n){for(var r,o,i=e.matches.reduce(function(e,n){return e*n.possibilities.length},1),a=Date.now(),u=function(r){var o,u;if(r%1e5==0)if(r>0){var c=function(e){var n=Math.round(Math.abs(e)/1e3);if(n<45)return"in a few seconds";var r=Math.round(n/60);if(r<=1)return"in 1 minute";if(r<60)return"in "+r+" minutes";var t=Math.round(r/60);if(t<=1)return"in 1 hour";if(t<24)return"in "+t+" hours";var o=Math.round(t/24);if(o<=1)return"in 1 day";if(o<30)return"in "+o+" days";var i=Math.round(o/30);if(i<=1)return"in 1 month";if(i<12)return"in "+i+" months";var a=Math.round(o/365);if(a<=1)return"in 1 year";return"in "+a+" years"}((Date.now()-a)*i/r),s={type:"progress",progress:r+" / "+i+", will be done "+c};postMessage(s,void 0)}else{s={type:"progress",progress:r+" / "+i};postMessage(s,void 0)}var f=e.teams.map(function(e){return{name:e,score:0}}),l=r,h=function(e){var n=e.possibilities[l%e.possibilities.length];0!==n.a&&(f.find(function(n){return n.name===e.a}).score+=n.a),0!==n.b&&(f.find(function(n){return n.name===e.b}).score+=n.b),l=Math.round(l/e.possibilities.length)};try{for(var d=t(e.matches),p=d.next();!p.done;p=d.next()){h(p.value)}}catch(e){o={error:e}}finally{try{p&&!p.done&&(u=d.return)&&u.call(d)}finally{if(o)throw o.error}}f.sort(function(e,n){return n.score-e.score});for(var v=function(r){for(var t=e.tops[r],o=f[t-1].score,i=f.findIndex(function(e){return e.score===o}),a=f.filter(function(e){return e.score===o}).length,u=function(e){if(f[e].score===o)n.find(function(n){return n.name===f[e].name}).chances[r]+=(t-i)/a;else{if(!(e<t))return"break";n.find(function(n){return n.name===f[e].name}).chances[r]++}},c=0;c<f.length;c++){if("break"===u(c))break}},m=0;m<e.tops.length;m++)v(m)},c=0;c<i;c++)u(c);try{for(var s=t(n),f=s.next();!f.done;f=s.next()){var l=f.value;l.chances=l.chances.map(function(e){return Math.round(100*e/i)})}}catch(e){r={error:e}}finally{try{f&&!f.done&&(o=s.return)&&o.call(s)}finally{if(r)throw r.error}}n.sort(function(e,n){for(var r=0;r<e.chances.length;r++){if(n.chances[r]>e.chances[r])return 1;if(n.chances[r]<e.chances[r])return-1}return n.score>e.score?1:n.score<e.score?-1:n.matchCountLeft-e.matchCountLeft})}onmessage=function(e){var n,r,i=e.data,a=[],u=function(e){var n=e.teams.map(function(n){return{name:n,chances:e.tops.map(function(e){return 0}),score:0,matchCountLeft:0}});!function(e,n){var r,o,i=function(e){if(1===e.possibilities.length){var r=e.possibilities[0];0!==r.a&&(n.find(function(n){return n.name===e.a}).score+=r.a),0!==r.b&&(n.find(function(n){return n.name===e.b}).score+=r.b)}else if(e.possibilities.length>1){var t=n.find(function(n){return n.name===e.a});t.matchCountLeft++,t.score+=e.possibilities.reduce(function(e,n){return Math.min(n.a,e)},1/0);var o=n.find(function(n){return n.name===e.b});o.matchCountLeft++,o.score+=e.possibilities.reduce(function(e,n){return Math.min(n.b,e)},1/0)}};try{for(var a=t(e.matches),u=a.next();!u.done;u=a.next())i(u.value)}catch(e){r={error:e}}finally{try{u&&!u.done&&(o=a.return)&&o.call(a)}finally{if(r)throw r.error}}n.sort(function(e,n){return n.score>e.score?1:n.score<e.score?-1:n.matchCountLeft-e.matchCountLeft})}(e,n),a.push({tops:e.tops,chances:n})};try{for(var c=t(i),s=c.next();!s.done;s=c.next()){u(s.value)}}catch(e){n={error:e}}finally{try{s&&!s.done&&(r=c.return)&&r.call(c)}finally{if(n)throw n.error}}postMessage({type:"initial-result",result:a},void 0);for(var f=0;f<i.length;f++)o(i[f],a[f].chances);postMessage({type:"final-result",result:a},void 0)}}]);