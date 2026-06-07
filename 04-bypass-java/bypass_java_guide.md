# 🔓 Étape 4 — Script universel Java pour bypass SSL Pinning

## Objectif

Neutraliser l'épinglage de certificat (SSL Pinning) au niveau Java via des hooks Frida. Le script couvre les couches les plus courantes de vérification TLS dans Android.

---

## Cibles du bypass

| # | Composant | Classe / API | Technique |
|---|-----------|-------------|-----------|
| 1 | SSLContext | `javax.net.ssl.SSLContext.init()` | Injection d'un TrustManager permissif |
| 2 | X509TrustManager | Toutes implémentations | Patch `checkServerTrusted` / `checkClientTrusted` |
| 3 | Conscrypt | `TrustManagerImpl` | Patch `checkTrusted` / `verifyChain` |
| 4 | OkHttp 3/4 | `okhttp3.CertificatePinner` | Neutralisation de `check()` |
| 5 | WebView | `android.webkit.WebViewClient` | `onReceivedSslError` → `handler.proceed()` |
| 6 | HttpsURLConnection | `javax.net.ssl.HttpsURLConnection` | Neutralisation du `HostnameVerifier` |

---

## Script : `sslpin_bypass_universal.js`

### Utilisation

```powershell
# Mode spawn (recommandé — injection dès le démarrage)
frida -U -f com.example.app -l sslpin_bypass_universal.js --no-pause

# Mode attach (si spawn crashe)
frida -U -n "NomDuProcessus" -l sslpin_bypass_universal.js
```

### Logs attendus

```
=====================================================
  Universal SSL Pinning Bypass — Java Layer
  Lab 15 — Inspection TLS/HTTPS
=====================================================

[+] SSL bypass: SSLContext.init patched
[+] SSL bypass: X509TrustManager broad patches applied
[+] SSL bypass: com.android.org.conscrypt.TrustManagerImpl patched
[+] SSL bypass: OkHttp CertificatePinner patched
[+] SSL bypass: WebViewClient.onReceivedSslError patched
[+] SSL bypass: HttpsURLConnection HostnameVerifier patched

=====================================================
  ✅ Universal SSL Pinning Bypass INSTALLED
=====================================================
```

Puis, lors des connexions réseau de l'app :

```
[+] SSL bypass: okhttp3.CertificatePinner.check → skip
[+] SSL bypass: com.android.org.conscrypt.TrustManagerImpl.checkTrusted → allow
```

---

## Explication détaillée des hooks

### 1. SSLContext.init

```
SSLContext.init(KeyManager[], TrustManager[], SecureRandom)
```

Si l'app ne fournit pas de TrustManager (ou un tableau vide), on injecte un `X509TrustManager` permissif qui accepte tous les certificats.

### 2. X509TrustManager (scan large)

Parcours de toutes les classes chargées contenant `trust` ou `pin` dans le nom. Pour chacune, on neutralise `checkServerTrusted` et `checkClientTrusted`.

### 3. Conscrypt TrustManagerImpl

Android 7+ utilise Conscrypt comme implémentation TLS. Les méthodes `checkTrusted`, `verifyChain` et `checkServerTrusted` sont patchées pour attraper et ignorer les exceptions de vérification.

### 4. OkHttp CertificatePinner

OkHttp est la librairie HTTP la plus utilisée en Android. Le `CertificatePinner.check()` est neutralisé (retour immédiat sans vérification). OkHttp 4 utilise aussi `check$okhttp` (nom Kotlin mangled).

### 5. WebViewClient

Pour les apps qui utilisent une WebView, `onReceivedSslError` est intercepté pour appeler `handler.proceed()` au lieu d'afficher une erreur.

### 6. HttpsURLConnection

Les `HostnameVerifier` personnalisés sont neutralisés pour éviter le rejet basé sur le hostname.

---

## Validation

| Critère | Comment vérifier | Résultat attendu |
|---------|-----------------|------------------|
| Logs Frida | Console Frida | Messages `[+] SSL bypass:` |
| Proxy | Burp / mitmproxy | Requêtes HTTPS visibles en clair |
| App fonctionnelle | Interface de l'app | L'app ne crashe pas et affiche ses données |

---

## Limitations

| Limitation | Solution |
|------------|----------|
| Pinning natif (BoringSSL) | Ajouter `sslpin_bypass_native.js` |
| Classes obfusquées | Utiliser `enum_classes.js` pour trouver les vrais noms |
| Cronet / Chromium | Hooks natifs nécessaires (pile réseau Chrome) |
| Certificate Transparency | Hooks supplémentaires (rare en mobile) |
