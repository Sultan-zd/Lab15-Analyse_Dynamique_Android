// ============================================================
// okhttp_bypass.js
// Lab 15 — Bypass SSL Pinning spécifique OkHttp 3/4
// ============================================================
// Cible : apps utilisant uniquement OkHttp pour le réseau
// Usage : frida -U -f <package> -l okhttp_bypass.js --no-pause
// ============================================================

'use strict';

Java.perform(function () {
  console.log('');
  console.log('=====================================================');
  console.log('  OkHttp SSL Pinning Bypass');
  console.log('=====================================================');

  // ─────────────────────────────────────────────────────────
  // 1) OkHttp 3.x / 4.x — CertificatePinner
  // ─────────────────────────────────────────────────────────
  var okhttpPackages = [
    'okhttp3.CertificatePinner',           // Standard OkHttp 3/4
    'com.android.okhttp.CertificatePinner', // AOSP embedded
    'com.squareup.okhttp.CertificatePinner' // OkHttp 2.x legacy
  ];

  okhttpPackages.forEach(function (cls) {
    try {
      var CP = Java.use(cls);

      // Patch check()
      if (CP.check) {
        CP.check.overloads.forEach(function (ov) {
          ov.implementation = function () {
            console.log('[+] ' + cls + '.check() → bypassed');
            return;
          };
        });
      }

      // Patch check$okhttp (Kotlin OkHttp 4)
      if (CP['check$okhttp']) {
        CP['check$okhttp'].overloads.forEach(function (ov) {
          ov.implementation = function () {
            console.log('[+] ' + cls + '.check$okhttp() → bypassed');
            return;
          };
        });
      }

      console.log('[+] ' + cls + ' patched');
    } catch (e) {
      console.log('[*] ' + cls + ' not found (expected if not used)');
    }
  });

  // ─────────────────────────────────────────────────────────
  // 2) Recherche de packages ombrés (obfusqués / renommés)
  // ─────────────────────────────────────────────────────────
  console.log('[*] Searching for shaded/obfuscated OkHttp...');
  var shadedFound = false;

  Java.enumerateLoadedClasses({
    onMatch: function (name) {
      // Chercher CertificatePinner dans des packages renommés
      if (
        name.endsWith('CertificatePinner') &&
        !name.startsWith('okhttp3.') &&
        !name.startsWith('com.android.okhttp.') &&
        !name.startsWith('com.squareup.okhttp.')
      ) {
        console.log('[!] Shaded OkHttp found: ' + name);
        shadedFound = true;
        try {
          var ShadedCP = Java.use(name);
          if (ShadedCP.check) {
            ShadedCP.check.overloads.forEach(function (ov) {
              ov.implementation = function () {
                console.log('[+] ' + name + '.check() → bypassed (shaded)');
                return;
              };
            });
          }
          console.log('[+] ' + name + ' patched (shaded)');
        } catch (e) {
          console.log('[-] Failed to hook shaded class: ' + name);
        }
      }
    },
    onComplete: function () {
      if (!shadedFound) {
        console.log('[*] No shaded OkHttp CertificatePinner found');
      }
    },
  });

  // ─────────────────────────────────────────────────────────
  // 3) OkHttp Interceptors — Logging (optionnel)
  // ─────────────────────────────────────────────────────────
  try {
    var RealCall = Java.use('okhttp3.internal.connection.RealCall');
    if (RealCall.execute) {
      RealCall.execute.implementation = function () {
        var response = this.execute();
        try {
          var request = this.request();
          console.log(
            '[*] OkHttp request: ' +
              request.method() +
              ' ' +
              request.url().toString()
          );
        } catch (e) {}
        return response;
      };
    }
    console.log('[+] OkHttp request logging enabled');
  } catch (e) {
    console.log('[*] OkHttp request logging not available');
  }

  console.log('');
  console.log('=====================================================');
  console.log('  ✅ OkHttp SSL Pinning Bypass INSTALLED');
  console.log('=====================================================');
});
