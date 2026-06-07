// webview_bypass.js — Lab 15 — WebView SSL Bypass
'use strict';
Java.perform(function(){
  console.log('[*] WebView SSL Bypass loading...');

  // 1) WebViewClient.onReceivedSslError
  try{
    var WVC = Java.use('android.webkit.WebViewClient');
    WVC.onReceivedSslError.implementation = function(view, handler, error){
      console.log('[+] WebViewClient.onReceivedSslError → proceed');
      handler.proceed();
    };
    console.log('[+] WebViewClient patched');
  }catch(e){ console.log('[-] WebViewClient patch failed:', e.message); }

  // 2) Custom WebViewClient subclasses
  try{
    Java.enumerateLoadedClasses({
      onMatch: function(name){
        if(name.toLowerCase().includes('webviewclient') && name !== 'android.webkit.WebViewClient'){
          try{
            var C = Java.use(name);
            if(C.onReceivedSslError){
              C.onReceivedSslError.implementation = function(v,h,e){ console.log('[+] '+name+'.onReceivedSslError → proceed'); h.proceed(); };
              console.log('[+] Patched: '+name);
            }
          }catch(_){}
        }
      },
      onComplete: function(){ console.log('[+] WebViewClient subclass scan done'); }
    });
  }catch(e){}

  // 3) WebView.setWebViewClient — dynamic hook
  try{
    var WV = Java.use('android.webkit.WebView');
    WV.setWebViewClient.implementation = function(client){
      console.log('[*] WebView.setWebViewClient: '+client.$className);
      try{
        var CC = Java.use(client.$className);
        if(CC.onReceivedSslError) CC.onReceivedSslError.implementation = function(v,h,e){ console.log('[+] Dynamic '+client.$className+' → proceed'); h.proceed(); };
      }catch(e){}
      return this.setWebViewClient(client);
    };
    console.log('[+] WebView.setWebViewClient hooked');
  }catch(e){}

  // 4) Mixed content mode
  try{
    var WS = Java.use('android.webkit.WebSettings');
    WS.setMixedContentMode.implementation = function(mode){ console.log('[+] MixedContentMode → ALWAYS_ALLOW'); return this.setMixedContentMode(0); };
  }catch(e){}

  console.log('[+] ✅ WebView SSL Bypass INSTALLED');
});
