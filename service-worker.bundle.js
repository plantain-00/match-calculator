"use strict";var precacheConfig=[["index.html","d67a12ef82c51ffbd5c3224ec63d2376"],["vendor.bundle-e9e5f41f6957311591e0d09bb3786a62.js","e9e5f41f6957311591e0d09bb3786a62"],["vs/base/worker/workerMain.js","cce3c2af8e247000e75f3a17d6a240b1"],["vs/basic-languages/javascript/javascript.js","59de70a1e3360b84513a353b8205f6fa"],["vs/basic-languages/typescript/typescript.js","6d2678f47ae55dac8742fbe8217ea016"],["vs/editor/editor.main.css","4015a738f0b4a25b31e1510b25d9982d"],["vs/editor/editor.main.js","5b9549ffffdd8b79c31dcecd3ea9aac1"],["vs/editor/editor.main.nls.js","8340765d91d7ca60351fb92699d31545"],["vs/language/typescript/tsMode.js","ac747f476ed487343529cd94843a210d"],["vs/loader.js","03d8cf05ea1aa550106c496c9d3ffc2d"],["worker.bundle.js","12bc4ea862cb36741b9c323a54649f2a"]];var cacheName="sw-precache-v3-sw-precache-"+(self.registration?self.registration.scope:"");var ignoreUrlParametersMatching=[/^utm_/];var addDirectoryIndex=function(originalUrl,index){var url=new URL(originalUrl);if(url.pathname.slice(-1)==="/"){url.pathname+=index}return url.toString()};var cleanResponse=function(originalResponse){if(!originalResponse.redirected){return Promise.resolve(originalResponse)}var bodyPromise="body"in originalResponse?Promise.resolve(originalResponse.body):originalResponse.blob();return bodyPromise.then(function(body){return new Response(body,{headers:originalResponse.headers,status:originalResponse.status,statusText:originalResponse.statusText})})};var createCacheKey=function(originalUrl,paramName,paramValue,dontCacheBustUrlsMatching){var url=new URL(originalUrl);if(!dontCacheBustUrlsMatching||!url.pathname.match(dontCacheBustUrlsMatching)){url.search+=(url.search?"&":"")+encodeURIComponent(paramName)+"="+encodeURIComponent(paramValue)}return url.toString()};var isPathWhitelisted=function(whitelist,absoluteUrlString){if(whitelist.length===0){return true}var path=new URL(absoluteUrlString).pathname;return whitelist.some(function(whitelistedPathRegex){return path.match(whitelistedPathRegex)})};var stripIgnoredUrlParameters=function(originalUrl,ignoreUrlParametersMatching){var url=new URL(originalUrl);url.hash="";url.search=url.search.slice(1).split("&").map(function(kv){return kv.split("=")}).filter(function(kv){return ignoreUrlParametersMatching.every(function(ignoredRegex){return!ignoredRegex.test(kv[0])})}).map(function(kv){return kv.join("=")}).join("&");return url.toString()};var hashParamName="_sw-precache";var urlsToCacheKeys=new Map(precacheConfig.map(function(item){var relativeUrl=item[0];var hash=item[1];var absoluteUrl=new URL(relativeUrl,self.location);var cacheKey=createCacheKey(absoluteUrl,hashParamName,hash,false);return[absoluteUrl.toString(),cacheKey]}));function setOfCachedUrls(cache){return cache.keys().then(function(requests){return requests.map(function(request){return request.url})}).then(function(urls){return new Set(urls)})}self.addEventListener("install",function(event){event.waitUntil(caches.open(cacheName).then(function(cache){return setOfCachedUrls(cache).then(function(cachedUrls){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(cacheKey){if(!cachedUrls.has(cacheKey)){var request=new Request(cacheKey,{credentials:"same-origin"});return fetch(request).then(function(response){if(!response.ok){throw new Error("Request for "+cacheKey+" returned a "+"response with status "+response.status)}return cleanResponse(response).then(function(responseToCache){return cache.put(cacheKey,responseToCache)})})}}))})}).then(function(){return self.skipWaiting()}))});self.addEventListener("activate",function(event){var setOfExpectedUrls=new Set(urlsToCacheKeys.values());event.waitUntil(caches.open(cacheName).then(function(cache){return cache.keys().then(function(existingRequests){return Promise.all(existingRequests.map(function(existingRequest){if(!setOfExpectedUrls.has(existingRequest.url)){return cache.delete(existingRequest)}}))})}).then(function(){return self.clients.claim()}))});self.addEventListener("fetch",function(event){if(event.request.method==="GET"){var shouldRespond;var url=stripIgnoredUrlParameters(event.request.url,ignoreUrlParametersMatching);shouldRespond=urlsToCacheKeys.has(url);var directoryIndex="index.html";if(!shouldRespond&&directoryIndex){url=addDirectoryIndex(url,directoryIndex);shouldRespond=urlsToCacheKeys.has(url)}var navigateFallback="";if(!shouldRespond&&navigateFallback&&event.request.mode==="navigate"&&isPathWhitelisted([],event.request.url)){url=new URL(navigateFallback,self.location).toString();shouldRespond=urlsToCacheKeys.has(url)}if(shouldRespond){event.respondWith(caches.open(cacheName).then(function(cache){return cache.match(urlsToCacheKeys.get(url)).then(function(response){if(response){return response}throw Error("The cached response that was expected is missing.")})}).catch(function(e){console.warn('Couldn\'t serve response for "%s" from cache: %O',event.request.url,e);return fetch(event.request)}))}}});