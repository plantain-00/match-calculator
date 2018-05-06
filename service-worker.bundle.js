"use strict";var precacheConfig=[["index.html","12f87fda65b5361ccd0086e6b118a595"],["vendor.bundle-4469994e0386305cf377343a838722aa.js","4469994e0386305cf377343a838722aa"],["vs/base/worker/workerMain.js","4e0bd2f5415cd8fb8ce83253a10ba541"],["vs/editor/editor.main.css","ac44caa6ce7037f20d20f6fc1f957b77"],["vs/editor/editor.main.js","d2bc37138324c0fa097cc3cd784d7f3f"],["vs/editor/editor.main.nls.js","f6998b14206f6297607eccc260bb849e"],["vs/language/json/jsonMode.js","172e569e2c45e2704b6f0b9dccd7d372"],["vs/language/json/jsonWorker.js","19451409d9281a1a694fdfab68456721"],["vs/loader.js","523b0eb5acc05493385467a81fc31c11"],["worker.bundle.js","57bf814e9177ebc96e62de61c49e5ab2"]];var cacheName="sw-precache-v3-sw-precache-"+(self.registration?self.registration.scope:"");var ignoreUrlParametersMatching=[/^utm_/];var addDirectoryIndex=function(originalUrl,index){var url=new URL(originalUrl);if(url.pathname.slice(-1)==="/"){url.pathname+=index}return url.toString()};var cleanResponse=function(originalResponse){if(!originalResponse.redirected){return Promise.resolve(originalResponse)}var bodyPromise="body"in originalResponse?Promise.resolve(originalResponse.body):originalResponse.blob();return bodyPromise.then(function(body){return new Response(body,{headers:originalResponse.headers,status:originalResponse.status,statusText:originalResponse.statusText})})};var createCacheKey=function(originalUrl,paramName,paramValue,dontCacheBustUrlsMatching){var url=new URL(originalUrl);if(!dontCacheBustUrlsMatching||!url.pathname.match(dontCacheBustUrlsMatching)){url.search+=(url.search?"&":"")+encodeURIComponent(paramName)+"="+encodeURIComponent(paramValue)}return url.toString()};var isPathWhitelisted=function(whitelist,absoluteUrlString){if(whitelist.length===0){return true}var path=new URL(absoluteUrlString).pathname;return whitelist.some(function(whitelistedPathRegex){return path.match(whitelistedPathRegex)})};var stripIgnoredUrlParameters=function(originalUrl,ignoreUrlParametersMatching){var url=new URL(originalUrl);url.hash="";url.search=url.search.slice(1).split("&").map(function(kv){return kv.split("=")}).filter(function(kv){return ignoreUrlParametersMatching.every(function(ignoredRegex){return!ignoredRegex.test(kv[0])})}).map(function(kv){return kv.join("=")}).join("&");return url.toString()};var hashParamName="_sw-precache";var urlsToCacheKeys=new Map(precacheConfig.map(function(item){var relativeUrl=item[0];var hash=item[1];var absoluteUrl=new URL(relativeUrl,self.location);var cacheKey=createCacheKey(absoluteUrl,hashParamName,hash,false);return[absoluteUrl.toString(),cacheKey]}));function setOfCachedUrls(cache){return cache.keys().then(function(requests){return requests.map(function(request){return request.url})}).then(function(urls){return new Set(urls)})}self.addEventListener("install",function(event){event.waitUntil(caches.open(cacheName).then(function(cache){return setOfCachedUrls(cache).then(function(cachedUrls){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(cacheKey){if(!cachedUrls.has(cacheKey)){var request=new Request(cacheKey,{credentials:"same-origin"});return fetch(request).then(function(response){if(!response.ok){throw new Error("Request for "+cacheKey+" returned a "+"response with status "+response.status)}return cleanResponse(response).then(function(responseToCache){return cache.put(cacheKey,responseToCache)})})}}))})}).then(function(){return self.skipWaiting()}))});self.addEventListener("activate",function(event){var setOfExpectedUrls=new Set(urlsToCacheKeys.values());event.waitUntil(caches.open(cacheName).then(function(cache){return cache.keys().then(function(existingRequests){return Promise.all(existingRequests.map(function(existingRequest){if(!setOfExpectedUrls.has(existingRequest.url)){return cache.delete(existingRequest)}}))})}).then(function(){return self.clients.claim()}))});self.addEventListener("fetch",function(event){if(event.request.method==="GET"){var shouldRespond;var url=stripIgnoredUrlParameters(event.request.url,ignoreUrlParametersMatching);shouldRespond=urlsToCacheKeys.has(url);var directoryIndex="index.html";if(!shouldRespond&&directoryIndex){url=addDirectoryIndex(url,directoryIndex);shouldRespond=urlsToCacheKeys.has(url)}var navigateFallback="";if(!shouldRespond&&navigateFallback&&event.request.mode==="navigate"&&isPathWhitelisted([],event.request.url)){url=new URL(navigateFallback,self.location).toString();shouldRespond=urlsToCacheKeys.has(url)}if(shouldRespond){event.respondWith(caches.open(cacheName).then(function(cache){return cache.match(urlsToCacheKeys.get(url)).then(function(response){if(response){return response}throw Error("The cached response that was expected is missing.")})}).catch(function(e){console.warn('Couldn\'t serve response for "%s" from cache: %O',event.request.url,e);return fetch(event.request)}))}}});