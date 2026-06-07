# 🎯 Étape 5 — Variantes et cibles spécifiques

## Objectif

Adapter le bypass SSL pinning selon la pile réseau utilisée par l'app cible.

---

## 5.1 OkHttp/Retrofit uniquement — `okhttp_bypass.js`

### Quand l'utiliser ?

- L'app utilise OkHttp 2.x, 3.x ou 4.x comme client HTTP
- L'app utilise Retrofit (basé sur OkHttp)
- Le package OkHttp peut être ombré (renommé/obfusqué)

### Fonctionnalités

| Fonction | Description |
|----------|-------------|
| `CertificatePinner.check()` | Neutralisé pour OkHttp standard |
| `check$okhttp()` | Neutralisé pour OkHttp 4 (Kotlin) |
| Scan packages ombrés | Détection automatique de `CertificatePinner` renommé |
| Logging requêtes | Log optionnel des requêtes OkHttp |

### Détecter un package ombré

```javascript
// Dans la REPL Frida :
Java.perform(function(){
  Java.enumerateLoadedClasses({
    onMatch: function(n){
      if(n.toLowerCase().includes('okhttp')) console.log(n);
    },
    onComplete: function(){ console.log('done'); }
  });
});
```

### Usage

```powershell
frida -U -f com.example.app -l okhttp_bypass.js --no-pause
```

---

## 5.2 Conscrypt moderne — Couvert par le script universel

Sur Android récents, `TrustManagerImpl` (Conscrypt) est souvent le point central. Le script universel patche déjà :
- `com.android.org.conscrypt.TrustManagerImpl`
- `org.conscrypt.TrustManagerImpl`

Méthodes patchées : `checkTrusted`, `verifyChain`, `checkServerTrusted`.

---

## 5.3 WebView embarquée — `webview_bypass.js`

### Quand l'utiliser ?

- L'app est essentiellement une WebView (app hybride)
- Le contenu web est chargé via HTTPS avec un certificat épinglé

### Fonctionnalités

| Fonction | Description |
|----------|-------------|
| `onReceivedSslError` | `handler.proceed()` au lieu de bloquer |
| Sous-classes custom | Scan et patch de toutes les sous-classes |
| Hook dynamique | Capture `setWebViewClient` et patche à la volée |
| Mixed content | Force `MIXED_CONTENT_ALWAYS_ALLOW` |

### Usage

```powershell
frida -U -f com.example.app -l webview_bypass.js --no-pause
```

---

## 5.4 Combinaison de variantes

```powershell
# OkHttp + WebView + universel
frida -U -f com.example.app \
  -l sslpin_bypass_universal.js \
  -l okhttp_bypass.js \
  -l webview_bypass.js \
  --no-pause
```

---

## Résumé des variantes

| Variante | Script | Pile réseau ciblée |
|----------|--------|--------------------|
| Universel | `sslpin_bypass_universal.js` | Toutes (Java) |
| OkHttp | `okhttp_bypass.js` | OkHttp 2/3/4 + ombrés |
| WebView | `webview_bypass.js` | WebView / apps hybrides |
| Natif | `sslpin_bypass_native.js` | BoringSSL / OpenSSL (étape 6) |
