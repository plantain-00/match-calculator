"use strict";var precacheConfig=[["index.html","2451166366a180692e1efe173a53533d"],["vendor.bundle-22ee7cd3d0f34a6563c3a23a6ada1b30.js","22ee7cd3d0f34a6563c3a23a6ada1b30"],["vs/base/worker/workerMain.js","93cdf8019f17ddfdbcbc7d00fcb1a786"],["vs/editor/editor.main.css","ad44f47d754a4d6cc7389b05fc37a508"],["vs/editor/editor.main.js","3a82940062c2a1874398c094a6e60dde"],["vs/editor/editor.main.nls.js","f490fab3eb9c793b20f99db9b6e48d95"],["vs/language/json/jsonMode.js","4a3dab54b23af097e9e414100867200e"],["vs/language/json/jsonWorker.js","4dcceaade2ef2a37ea5b3f6883f5fe95"],["vs/loader.js","c8164365b9ce6609cb37358a167fb342"],["worker.bundle.js","89a05a5707aa9e515f694bf51b8e1f0e"]];var cacheName="sw-precache-v3-sw-precache-"+(self.registration?self.registration.scope:"");var ignoreUrlParametersMatching=[/^utm_/];var addDirectoryIndex=function(originalUrl,index){var url=new URL(originalUrl);if(url.pathname.slice(-1)==="/"){url.pathname+=index}return url.toString()};var cleanResponse=function(originalResponse){if(!originalResponse.redirected){return Promise.resolve(originalResponse)}var bodyPromise="body"in originalResponse?Promise.resolve(originalResponse.body):originalResponse.blob();return bodyPromise.then(function(body){return new Response(body,{headers:originalResponse.headers,status:originalResponse.status,statusText:originalResponse.statusText})})};var createCacheKey=function(originalUrl,paramName,paramValue,dontCacheBustUrlsMatching){var url=new URL(originalUrl);if(!dontCacheBustUrlsMatching||!url.pathname.match(dontCacheBustUrlsMatching)){url.search+=(url.search?"&":"")+encodeURIComponent(paramName)+"="+encodeURIComponent(paramValue)}return url.toString()};var isPathWhitelisted=function(whitelist,absoluteUrlString){if(whitelist.length===0){return true}var path=new URL(absoluteUrlString).pathname;return whitelist.some(function(whitelistedPathRegex){return path.match(whitelistedPathRegex)})};var stripIgnoredUrlParameters=function(originalUrl,ignoreUrlParametersMatching){var url=new URL(originalUrl);url.hash="";url.search=url.search.slice(1).split("&").map(function(kv){return kv.split("=")}).filter(function(kv){return ignoreUrlParametersMatching.every(function(ignoredRegex){return!ignoredRegex.test(kv[0])})}).map(function(kv){return kv.join("=")}).join("&");return url.toString()};var hashParamName="_sw-precache";var urlsToCacheKeys=new Map(precacheConfig.map(function(item){var relativeUrl=item[0];var hash=item[1];var absoluteUrl=new URL(relativeUrl,self.location);var cacheKey=createCacheKey(absoluteUrl,hashParamName,hash,false);return[absoluteUrl.toString(),cacheKey]}));function setOfCachedUrls(cache){return cache.keys().then(function(requests){return requests.map(function(request){return request.url})}).then(function(urls){return new Set(urls)})}self.addEventListener("install",function(event){event.waitUntil(caches.open(cacheName).then(function(cache){return setOfCachedUrls(cache).then(function(cachedUrls){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(cacheKey){if(!cachedUrls.has(cacheKey)){var request=new Request(cacheKey,{credentials:"same-origin"});return fetch(request).then(function(response){if(!response.ok){throw new Error("Request for "+cacheKey+" returned a "+"response with status "+response.status)}return cleanResponse(response).then(function(responseToCache){return cache.put(cacheKey,responseToCache)})})}}))})}).then(function(){return self.skipWaiting()}))});self.addEventListener("activate",function(event){var setOfExpectedUrls=new Set(urlsToCacheKeys.values());event.waitUntil(caches.open(cacheName).then(function(cache){return cache.keys().then(function(existingRequests){return Promise.all(existingRequests.map(function(existingRequest){if(!setOfExpectedUrls.has(existingRequest.url)){return cache.delete(existingRequest)}}))})}).then(function(){return self.clients.claim()}))});self.addEventListener("fetch",function(event){if(event.request.method==="GET"){var shouldRespond;var url=stripIgnoredUrlParameters(event.request.url,ignoreUrlParametersMatching);shouldRespond=urlsToCacheKeys.has(url);var directoryIndex="index.html";if(!shouldRespond&&directoryIndex){url=addDirectoryIndex(url,directoryIndex);shouldRespond=urlsToCacheKeys.has(url)}var navigateFallback="";if(!shouldRespond&&navigateFallback&&event.request.mode==="navigate"&&isPathWhitelisted([],event.request.url)){url=new URL(navigateFallback,self.location).toString();shouldRespond=urlsToCacheKeys.has(url)}if(shouldRespond){event.respondWith(caches.open(cacheName).then(function(cache){return cache.match(urlsToCacheKeys.get(url)).then(function(response){if(response){return response}throw Error("The cached response that was expected is missing.")})}).catch(function(e){console.warn('Couldn\'t serve response for "%s" from cache: %O',event.request.url,e);return fetch(event.request)}))}}});