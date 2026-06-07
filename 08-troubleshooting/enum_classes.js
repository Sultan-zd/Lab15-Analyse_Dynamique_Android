// ============================================================
// enum_classes.js
// Lab 15 — Énumération des classes SSL/TLS/Pinning
// ============================================================
// Usage : frida -U -f <package> -l enum_classes.js --no-pause
// But : identifier les classes liées au SSL/pinning (obfuscation)
// ============================================================

'use strict';

Java.perform(function () {
  console.log('');
  console.log('=====================================================');
  console.log('  Class Enumeration — SSL / TLS / Pinning');
  console.log('=====================================================');
  console.log('');

  var keywords = ['ssl', 'tls', 'trust', 'pin', 'cert', 'x509', 'okhttp', 'conscrypt', 'webview', 'verify'];
  var results = {};

  keywords.forEach(function (kw) {
    results[kw] = [];
  });

  Java.enumerateLoadedClasses({
    onMatch: function (name) {
      var low = name.toLowerCase();
      keywords.forEach(function (kw) {
        if (low.includes(kw)) {
          results[kw].push(name);
        }
      });
    },
    onComplete: function () {
      keywords.forEach(function (kw) {
        if (results[kw].length > 0) {
          console.log('');
          console.log('─── [' + kw.toUpperCase() + '] (' + results[kw].length + ' classes) ───');
          results[kw].forEach(function (cls) {
            console.log('  ' + cls);
          });
        }
      });
      console.log('');
      console.log('=====================================================');
      console.log('  Enumeration complete');
      console.log('=====================================================');
    },
  });
});
