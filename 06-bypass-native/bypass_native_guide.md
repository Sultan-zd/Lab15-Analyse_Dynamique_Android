# 🔧 Étape 6 — Cas avancé : Pinning natif (BoringSSL/OpenSSL)

## Objectif

Quand le bypass Java ne suffit pas (aucune requête dans le proxy), l'app fait probablement le pinning dans du code natif C/C++. Il faut hooker les fonctions SSL de la libc/libssl.

---

## 6.1 Diagnostic : pourquoi le bypass Java ne suffit pas ?

| Symptôme | Cause probable |
|----------|---------------|
| Aucune requête dans le proxy malgré hooks Java | Pinning natif (BoringSSL) |
| L'app utilise Cronet / Chromium | Pile réseau native Chrome |
| Logs Frida OK mais pas de trafic | Vérification côté native après Java |
| Lib `.so` custom dans l'APK | Implémentation TLS propriétaire |

---

## 6.2 Découverte des symboles natifs

```powershell
# Tracer les appels SSL natifs
frida-trace -U -i "SSL_*" -i "X509_*" com.example.app
```

### Symboles à surveiller

| Symbole | Rôle | Valeur de succès |
|---------|------|-----------------|
| `SSL_get_verify_result` | Résultat de vérification du certificat | `0` (X509_V_OK) |
| `X509_verify_cert` | Vérification de la chaîne de certificats | `1` (succès) |
| `SSL_CTX_set_custom_verify` | Callback de vérification custom (BoringSSL) | Callback retourne `0` |
| `SSL_set_custom_verify` | Idem, niveau connexion | Callback retourne `0` |
| `SSL_CTX_set_verify` | Mode de vérification SSL | `0` (SSL_VERIFY_NONE) |

---

## 6.3 Script : `sslpin_bypass_native.js`

### Hooks implémentés

| # | Fonction | Action |
|---|----------|--------|
| 1 | `SSL_get_verify_result` | Force le retour à `0` (X509_V_OK) |
| 2 | `X509_verify_cert` | Force le retour à `1` (succès) |
| 3 | `SSL_CTX_set_custom_verify` | Remplace le callback par un qui retourne `0` |
| 4 | `SSL_set_custom_verify` | Idem |
| 5 | `SSL_CTX_set_verify` | Force le mode à `SSL_VERIFY_NONE` |

### Usage

```powershell
# Natif seul
frida -U -f com.example.app -l sslpin_bypass_native.js --no-pause

# Combiné Java + natif (recommandé)
frida -U -f com.example.app -l sslpin_bypass_universal.js -l sslpin_bypass_native.js --no-pause
```

### Logs attendus

```
=====================================================
  Native SSL Pinning Bypass (BoringSSL / OpenSSL)
=====================================================

[+] Hooked: SSL_get_verify_result (libssl.so)
[+] Hooked: X509_verify_cert
[+] Hooked: SSL_CTX_set_custom_verify
[+] SSL_CTX_set_verify mode: 2 → 0 (NONE)

  ✅ Native SSL Pinning Bypass INSTALLED

[+] SSL_get_verify_result: 21 → 0 (X509_V_OK)
[+] SSL_CTX_set_custom_verify callback → ssl_verify_ok
```

---

## 6.4 Cas spéciaux

### Cronet / Chromium

Cronet utilise BoringSSL en interne. Les hooks `SSL_get_verify_result` et `SSL_CTX_set_custom_verify` couvrent ce cas. Si besoin, chercher les classes Java Chromium :

```javascript
Java.perform(function(){
  Java.enumerateLoadedClasses({
    onMatch: function(n){
      if(n.includes('org.chromium.net')) console.log(n);
    },
    onComplete: function(){}
  });
});
```

### Lib native custom

Certaines apps embarquent leur propre `libssl.so` ou `libcrypto.so`. Identifier la lib :

```powershell
# Lister les modules natifs chargés
frida -U -n "AppName" -e "Process.enumerateModules().forEach(function(m){ if(m.name.includes('ssl') || m.name.includes('crypto')) console.log(m.name, m.base); })"
```

Puis cibler spécifiquement cette lib dans les hooks.

---

## Résumé

| Couche | Script | Couverture |
|--------|--------|------------|
| Java | `sslpin_bypass_universal.js` | SSLContext, TrustManager, Conscrypt, OkHttp, WebView |
| Natif | `sslpin_bypass_native.js` | BoringSSL, OpenSSL, callbacks custom |
| Combiné | Les deux scripts | Couverture maximale ✅ |
