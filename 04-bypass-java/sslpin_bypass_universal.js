// ============================================================
// sslpin_bypass_universal.js
// Lab 15 — Script universel de bypass SSL Pinning (Java)
// ============================================================
// Couvre : SSLContext.init, X509TrustManager, Conscrypt,
//          OkHttp CertificatePinner, WebViewClient
// Usage : frida -U -f <package> -l sslpin_bypass_universal.js --no-pause
// ============================================================

'use strict';

Java.perform(function () {
  const ArrayList = Java.use('java.util.ArrayList');
  const TAG = '[+] SSL bypass:';

  function ok(tag) {
    console.log(TAG, tag);
  }

  console.log('');
  console.log('=====================================================');
  console.log('  Universal SSL Pinning Bypass — Java Layer');
  console.log('  Lab 15 — Inspection TLS/HTTPS');
  console.log('=====================================================');
  console.log('');

  // ─────────────────────────────────────────────────────────
  // 1) SSLContext.init — Injecter un TrustManager permissif
  // ─────────────────────────────────────────────────────────
  try {
    const SSLContext = Java.use('javax.net.ssl.SSLContext');
    SSLContext.init.overload(
      '[Ljavax.net.ssl.KeyManager;',
      '[Ljavax.net.ssl.TrustManager;',
      'java.security.SecureRandom'
    ).implementation = function (km, tm, sr) {
      let useTm = tm;
      try {
        if (!tm || tm.length === 0) {
          // Créer un TrustManager permissif qui accepte tout
          const X509TM = Java.registerClass({
            name: 'com.frida.PermissiveTrustManager',
            implements: [Java.use('javax.net.ssl.X509TrustManager')],
            methods: {
              checkClientTrusted: function (chain, authType) {
                // Accepter tous les certificats client
              },
              checkServerTrusted: function (chain, authType) {
                // Accepter tous les certificats serveur
              },
              getAcceptedIssuers: function () {
                return Java.array(
                  'java.security.cert.X509Certificate',
                  []
                );
              },
            },
          });
          const TMArr = Java.use('[Ljavax.net.ssl.TrustManager;');
          const arr = TMArr.$new(1);
          arr[0] = X509TM.$new();
          useTm = arr;
          ok('Injected permissive TrustManager into SSLContext.init');
        }
      } catch (e) {
        /* Silencieux — ne pas casser l'app */
      }
      return this.init(km, useTm, sr);
    };
    ok('SSLContext.init patched');
  } catch (e) {
    console.log('[-] SSLContext.init patch failed:', e.message);
  }

  // ─────────────────────────────────────────────────────────
  // 2) Patch large : toutes les implémentations X509TrustManager
  // ─────────────────────────────────────────────────────────
  try {
    Java.enumerateLoadedClasses({
      onMatch: function (name) {
        var low = name.toLowerCase();
        if (low.includes('trust') || low.includes('pin')) {
          try {
            var K = Java.use(name);
            ['checkServerTrusted', 'checkClientTrusted'].forEach(function (m) {
              if (K[m]) {
                K[m].overloads.forEach(function (ov) {
                  ov.implementation = function () {
                    ok(name + '.' + m + ' → allow');
                    return null;
                  };
                });
              }
            });
          } catch (_) {
            /* Classe non hookable — ignorer */
          }
        }
      },
      onComplete: function () {
        ok('X509TrustManager broad patches applied');
      },
    });
  } catch (e) {
    console.log('[-] enumerateLoadedClasses failed:', e.message);
  }

  // ─────────────────────────────────────────────────────────
  // 3) Conscrypt TrustManagerImpl (Android 7+)
  // ─────────────────────────────────────────────────────────
  var conscryptClasses = [
    'com.android.org.conscrypt.TrustManagerImpl',
    'org.conscrypt.TrustManagerImpl',
  ];

  conscryptClasses.forEach(function (cls) {
    try {
      var TMI = Java.use(cls);
      ['checkTrusted', 'verifyChain', 'checkServerTrusted'].forEach(
        function (m) {
          if (TMI[m]) {
            TMI[m].overloads.forEach(function (ov) {
              ov.implementation = function () {
                ok(cls + '.' + m + ' → allow');
                try {
                  return ov.apply(this, arguments);
                } catch (e) {
                  // Si la vérification échoue, retourner une liste vide
                  try {
                    return ArrayList.$new();
                  } catch (_) {
                    return null;
                  }
                }
              };
            });
          }
        }
      );
      ok(cls + ' patched');
    } catch (e) {
      /* Classe non présente sur cette version Android */
    }
  });

  // ─────────────────────────────────────────────────────────
  // 4) OkHttp 3/4 — CertificatePinner.check
  // ─────────────────────────────────────────────────────────
  try {
    var CP = Java.use('okhttp3.CertificatePinner');
    if (CP.check) {
      CP.check.overloads.forEach(function (ov) {
        ov.implementation = function () {
          ok('okhttp3.CertificatePinner.check → skip');
          return;
        };
      });
    }
    // OkHttp 4 utilise aussi check$okhttp
    if (CP['check$okhttp']) {
      CP['check$okhttp'].overloads.forEach(function (ov) {
        ov.implementation = function () {
          ok('okhttp3.CertificatePinner.check$okhttp → skip');
          return;
        };
      });
    }
    ok('OkHttp CertificatePinner patched');
  } catch (e) {
    console.log('[*] OkHttp not present or not loaded yet');
  }

  // ─────────────────────────────────────────────────────────
  // 5) WebViewClient — Ignorer les erreurs SSL
  // ─────────────────────────────────────────────────────────
  try {
    var WVC = Java.use('android.webkit.WebViewClient');
    if (WVC.onReceivedSslError) {
      WVC.onReceivedSslError.implementation = function (
        view,
        handler,
        error
      ) {
        ok('WebView onReceivedSslError → proceed');
        handler.proceed();
      };
    }
    ok('WebViewClient.onReceivedSslError patched');
  } catch (e) {
    console.log('[*] WebViewClient patch skipped:', e.message);
  }

  // ─────────────────────────────────────────────────────────
  // 6) HttpsURLConnection — Désactiver HostnameVerifier
  // ─────────────────────────────────────────────────────────
  try {
    var HttpsURLConnection = Java.use('javax.net.ssl.HttpsURLConnection');
    HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (
      verifier
    ) {
      ok('HttpsURLConnection.setDefaultHostnameVerifier → noop');
      // Ne pas appliquer le verifier
    };
    HttpsURLConnection.setHostnameVerifier.implementation = function (
      verifier
    ) {
      ok('HttpsURLConnection.setHostnameVerifier → noop');
      // Ne pas appliquer le verifier
    };
    ok('HttpsURLConnection HostnameVerifier patched');
  } catch (e) {
    console.log('[*] HttpsURLConnection patch skipped');
  }

  // ─────────────────────────────────────────────────────────
  // Résumé final
  // ─────────────────────────────────────────────────────────
  console.log('');
  console.log('=====================================================');
  console.log('  ✅ Universal SSL Pinning Bypass INSTALLED');
  console.log('  Hooks actifs : SSLContext, TrustManager,');
  console.log('    Conscrypt, OkHttp, WebView, HttpsURLConnection');
  console.log('=====================================================');
  console.log('');
});
