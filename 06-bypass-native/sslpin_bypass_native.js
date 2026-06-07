// ============================================================
// sslpin_bypass_native.js
// Lab 15 — Bypass SSL Pinning natif (BoringSSL / OpenSSL)
// ============================================================
// Cible : apps qui font le pinning dans une lib native
// Usage : frida -U -f <package> -l sslpin_bypass_native.js --no-pause
// Combiner avec : sslpin_bypass_universal.js pour couverture complète
// ============================================================

'use strict';

(function () {
  console.log('');
  console.log('=====================================================');
  console.log('  Native SSL Pinning Bypass (BoringSSL / OpenSSL)');
  console.log('=====================================================');

  // ─────────────────────────────────────────────────────────
  // Helper : hook une fonction native et modifier le retour
  // ─────────────────────────────────────────────────────────
  function hookNative(name, lib, onLeaveCallback) {
    var addr = Module.findExportByName(lib || null, name);
    if (!addr) {
      console.log('[*] Symbol not found: ' + name + (lib ? ' in ' + lib : ''));
      return false;
    }
    Interceptor.attach(addr, {
      onEnter: function (args) {
        // Stocker pour onLeave si nécessaire
        this.name = name;
      },
      onLeave: function (retval) {
        if (onLeaveCallback) {
          onLeaveCallback(retval, this);
        }
      },
    });
    console.log('[+] Hooked: ' + name + (lib ? ' (' + lib + ')' : ''));
    return true;
  }

  // ─────────────────────────────────────────────────────────
  // 1) SSL_get_verify_result → retourner X509_V_OK (0)
  // ─────────────────────────────────────────────────────────
  var libs = ['libssl.so', 'libssl.so.3', null];
  var hooked_verify = false;

  libs.forEach(function (lib) {
    if (!hooked_verify) {
      hooked_verify = hookNative('SSL_get_verify_result', lib, function (retval) {
        if (retval.toInt32() !== 0) {
          console.log('[+] SSL_get_verify_result: ' + retval + ' → 0 (X509_V_OK)');
          retval.replace(ptr(0));
        }
      });
    }
  });

  // ─────────────────────────────────────────────────────────
  // 2) X509_verify_cert → retourner 1 (succès)
  // ─────────────────────────────────────────────────────────
  libs.forEach(function (lib) {
    hookNative('X509_verify_cert', lib, function (retval) {
      if (retval.toInt32() !== 1) {
        console.log('[+] X509_verify_cert: ' + retval + ' → 1 (success)');
        retval.replace(ptr(1));
      }
    });
  });

  // ─────────────────────────────────────────────────────────
  // 3) SSL_CTX_set_custom_verify / SSL_set_custom_verify
  //    (BoringSSL callback de vérification personnalisée)
  // ─────────────────────────────────────────────────────────
  ['SSL_CTX_set_custom_verify', 'SSL_set_custom_verify'].forEach(function (fname) {
    var addr = Module.findExportByName(null, fname);
    if (addr) {
      Interceptor.attach(addr, {
        onEnter: function (args) {
          // args[2] = callback de vérification
          // Remplacer par un callback qui retourne toujours 0 (ssl_verify_ok)
          var nullCallback = new NativeCallback(function () {
            console.log('[+] ' + fname + ' callback → ssl_verify_ok');
            return 0; // ssl_verify_ok
          }, 'int', ['pointer', 'pointer']);
          args[2] = nullCallback;
          console.log('[+] ' + fname + ' → callback replaced');
        },
      });
      console.log('[+] Hooked: ' + fname);
    } else {
      console.log('[*] ' + fname + ' not found');
    }
  });

  // ─────────────────────────────────────────────────────────
  // 4) SSL_CTX_set_verify — Désactiver la vérification
  // ─────────────────────────────────────────────────────────
  var ssl_ctx_set_verify = Module.findExportByName(null, 'SSL_CTX_set_verify');
  if (ssl_ctx_set_verify) {
    Interceptor.attach(ssl_ctx_set_verify, {
      onEnter: function (args) {
        // args[1] = mode de vérification, 0 = SSL_VERIFY_NONE
        console.log('[+] SSL_CTX_set_verify mode: ' + args[1] + ' → 0 (NONE)');
        args[1] = ptr(0);
      },
    });
    console.log('[+] Hooked: SSL_CTX_set_verify');
  }

  console.log('');
  console.log('=====================================================');
  console.log('  ✅ Native SSL Pinning Bypass INSTALLED');
  console.log('=====================================================');
})();
