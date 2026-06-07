# 🔐 Lab 15 — Analyse Dynamique Android : Inspection TLS/HTTPS et Gestion du SSL Pinning

> **Outils** : Frida · Objection · Burp Suite / mitmproxy | **Cadre** : OWASP MASVS/MASTG | **Niveau** : Intermédiaire

---

## 📋 Table des matières

- [Description](#-description)
- [Objectifs pédagogiques](#-objectifs-pédagogiques)
- [Prérequis](#-prérequis)
- [Architecture du lab](#-architecture-du-lab)
- [Panorama du SSL Pinning](#-panorama-du-ssl-pinning)
- [Méthodologie](#-méthodologie)
- [Déroulement des étapes](#-déroulement-des-étapes)
- [Livrables](#-livrables)
- [Résultats clés](#-résultats-clés)
- [Exercices pratiques](#-exercices-pratiques-barème)
- [Règles et éthique](#-règles-et-éthique)
- [Troubleshooting](#-troubleshooting)
- [FAQ rapide](#-faq-rapide)
- [Glossaire](#-glossaire)
- [Ressources](#-ressources-complémentaires)
- [Auteur](#-auteur)

---

## ⚠️ Avertissement légal

> **Utilisez ces techniques UNIQUEMENT sur des appareils/applications que vous possédez ou pour lesquels vous avez une autorisation écrite.**
>
> Le contournement du SSL pinning vise l'inspection de trafic à des fins de sécurité. N'exposez pas de données réelles, ne déployez pas ces méthodes en production, et retirez toujours le certificat CA et frida-server après vos tests.

---

## 📖 Description

Ce lab couvre l'**inspection du trafic HTTPS** d'applications Android en contournant les mécanismes d'**épinglage de certificat (SSL Pinning)** via instrumentation dynamique. L'approche est multi-couches : hooks Java (SSLContext, TrustManager, Conscrypt, OkHttp, WebView), hooks natifs (BoringSSL/OpenSSL), et outils CLI (Objection).

| Aspect | Détail |
|--------|--------|
| **Outil principal** | Frida 16.5.9 (CLI + scripts JavaScript) |
| **Outil secondaire** | Objection 1.11.0 (CLI Python basée sur Frida) |
| **Proxy TLS** | Burp Suite Community/Pro ou mitmproxy |
| **Type d'analyse** | Instrumentation dynamique — bypass SSL pinning |
| **Cible** | Application Android avec SSL pinning |
| **Environnement** | Appareil Android (API 26+) ou émulateur |
| **Référentiel** | OWASP MASVS v2.0 — MASVS-NETWORK |

---

## 🎯 Objectifs pédagogiques

- ✅ **Installer** Frida côté PC et frida-server sur Android
- ✅ **Configurer** un proxy TLS (Burp / mitmproxy) avec certificat CA
- ✅ **Neutraliser** le SSL pinning Java (SSLContext, TrustManager, Conscrypt, OkHttp)
- ✅ **Bypasser** le pinning WebView (onReceivedSslError, sous-classes custom)
- ✅ **Diagnostiquer** et bypasser le pinning natif (BoringSSL/OpenSSL)
- ✅ **Utiliser** Objection pour un bypass rapide (`android sslpinning disable`)
- ✅ **Valider** en capturant le trafic HTTPS déchiffré dans le proxy
- ✅ **Gérer** les cas d'obfuscation (packages ombrés, classes renommées)

---

## ⚙️ Prérequis

### Environnement

| Composant | Requis |
|-----------|--------|
| 💻 PC | Windows/macOS/Linux avec Internet |
| 🐍 Python | 3.8+ avec pip |
| 🔧 ADB | Android Platform Tools dans le PATH |
| 📱 Android | 8.0+ avec Débogage USB activé |
| 🔑 Frida | Client PC + frida-server Android (versions alignées) |
| 🌐 Proxy | Burp Suite ou mitmproxy installé |

### Outils utilisés

| Outil | Version | Rôle |
|-------|---------|------|
| Frida CLI | 16.5.9 | Injection de scripts JavaScript |
| frida-server | 16.5.9 | Agent sur l'appareil |
| frida-trace | 16.5.9 | Traçage de fonctions natives |
| Objection | 1.11.0 | CLI de bypass SSL prête à l'emploi |
| Burp Suite | Latest | Proxy TLS avec GUI |
| mitmproxy | 10.x | Proxy TLS scriptable |

### Vérifications rapides

```powershell
python --version          # Python 3.11.x
pip --version             # pip 24.x
adb version               # 1.0.41
adb devices               # → device
frida --version            # 16.5.9
```

---

## 📁 Architecture du lab

```
Lab15/
├── 📂 00-setup/                           # Configuration et périmètre
│   ├── scope.md                           # Périmètre d'analyse et autorisations
│   └── environment_check.md               # Vérification de l'environnement
│
├── 📂 01-install-frida/                   # Étape 1 — Installation Frida + frida-server
│   └── frida_install_guide.md             # Guide complet d'installation
│
├── 📂 02-proxy-setup/                     # Étape 2 — Proxy TLS et certificat CA
│   └── proxy_setup_guide.md              # Burp/mitmproxy + CA + redirection
│
├── 📂 03-target-app/                      # Étape 3 — Identification app cible
│   └── target_identification_guide.md    # Package, spawn vs attach
│
├── 📂 04-bypass-java/                     # Étape 4 — Bypass SSL Java universel
│   ├── bypass_java_guide.md              # Guide détaillé des hooks Java
│   └── sslpin_bypass_universal.js        # Script universel (6 couches)
│
├── 📂 05-variantes/                       # Étape 5 — Variantes spécifiques
│   ├── variantes_guide.md               # Guide des variantes
│   ├── okhttp_bypass.js                  # Bypass OkHttp + packages ombrés
│   └── webview_bypass.js                 # Bypass WebView + sous-classes
│
├── 📂 06-bypass-native/                   # Étape 6 — Bypass natif BoringSSL/OpenSSL
│   ├── bypass_native_guide.md            # Guide hooks natifs
│   └── sslpin_bypass_native.js           # Script natif (SSL_get_verify_result, etc.)
│
├── 📂 07-objection/                       # Étape 7 — Objection CLI
│   └── objection_guide.md               # android sslpinning disable
│
├── 📂 08-troubleshooting/                 # Dépannage
│   ├── troubleshooting.md               # FAQ et solutions
│   └── enum_classes.js                   # Script d'énumération des classes
│
├── 📂 09-annexes/                         # Snippets et références
│   └── snippets.md                       # Commandes ADB/Frida/Objection/OpenSSL
│
├── analyse_info.txt                       # Métadonnées de traçabilité
├── commands.log                           # Log chronologique des commandes
├── checklist_fin.md                       # Checklist de clôture signée
└── README.md                              # Ce fichier
```

---

## 🔍 Panorama du SSL Pinning

### Couche Java

| Technique | Classe / API | Méthode de bypass |
|-----------|-------------|-------------------|
| SSLContext | `javax.net.ssl.SSLContext.init()` | Injection TrustManager permissif |
| TrustManager | `X509TrustManager` implémentations | Patch `checkServerTrusted` |
| Conscrypt | `TrustManagerImpl` | Patch `checkTrusted` / `verifyChain` |
| OkHttp | `okhttp3.CertificatePinner` | Neutralisation de `check()` |
| WebView | `WebViewClient.onReceivedSslError` | `handler.proceed()` |
| HttpsURLConnection | `HostnameVerifier` | Neutralisation du verifier |

### Couche native

| Technique | Fonction | Valeur de succès |
|-----------|----------|-----------------|
| Résultat de vérification | `SSL_get_verify_result` | `0` (X509_V_OK) |
| Vérification certificat | `X509_verify_cert` | `1` (succès) |
| Callback custom | `SSL_CTX_set_custom_verify` | Callback → `0` |
| Mode de vérification | `SSL_CTX_set_verify` | `SSL_VERIFY_NONE` |

### Network Security Config (Android 7+)

```
Android < 7.0 : CA utilisateur → ✅ Confiance par défaut
Android ≥ 7.0 : CA utilisateur → ❌ Ignorée par défaut → hooks nécessaires
```

---

## 🔬 Méthodologie

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   ÉTAPE 1    │──▶│   ÉTAPE 2    │──▶│   ÉTAPE 3    │──▶│   ÉTAPE 4    │
│ Frida/Server │   │ Proxy + CA   │   │ App cible    │   │ Bypass Java  │
│  installer   │   │   configurer │   │  identifier  │   │  (universel) │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
                                                                │
┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│   ÉTAPE 7    │   │   ÉTAPE 6    │   │   ÉTAPE 5    │◀────────┘
│  Validation  │   │ Bypass natif │   │  Variantes   │
│   + proxy    │   │ (BoringSSL)  │   │ OkHttp/WebV  │
└──────────────┘   └──────────────┘   └──────────────┘
```

| Phase | Actions | Outils | Livrables |
|-------|---------|--------|-----------| 
| Setup | Frida, ADB, frida-server | pip, ADB | `00-setup/`, `01-install-frida/` |
| Proxy | Burp/mitmproxy, CA, redirection | Proxy | `02-proxy-setup/` |
| Cible | Identifier package, mode spawn/attach | Frida | `03-target-app/` |
| Bypass Java | SSLContext, TrustManager, OkHttp | Frida | `04-bypass-java/` |
| Variantes | OkHttp ombré, WebView, Conscrypt | Frida | `05-variantes/` |
| Bypass natif | BoringSSL, SSL_get_verify_result | Frida | `06-bypass-native/` |
| Objection | `android sslpinning disable` | Objection | `07-objection/` |
| Validation | Trafic HTTPS en clair dans le proxy | Proxy | Captures |

---

## 📝 Déroulement des étapes

### Étape 1 — Installer Frida et frida-server (15 min)

```powershell
python -m pip install --upgrade frida frida-tools
frida --version                                            # 16.5.9
adb shell getprop ro.product.cpu.abi                       # arm64-v8a
adb push frida-server /data/local/tmp/
adb shell chmod 755 /data/local/tmp/frida-server
adb shell "/data/local/tmp/frida-server -l 0.0.0.0 &"
frida-ps -Uai                                             # → liste apps
```

→ Guide : [`01-install-frida/frida_install_guide.md`](./01-install-frida/frida_install_guide.md)

### Étape 2 — Proxy TLS et certificat CA (15 min)

```powershell
# Burp : Proxy > Options > 127.0.0.1:8080
# mitmproxy :
mitmproxy -p 8080

# Installer CA : http://burp ou http://mitm.it depuis le téléphone
# Rediriger le trafic :
adb reverse tcp:8080 tcp:8080
```

→ Guide : [`02-proxy-setup/proxy_setup_guide.md`](./02-proxy-setup/proxy_setup_guide.md)

### Étape 3 — Identifier et lancer l'app cible (10 min)

```powershell
frida-ps -Uai | Select-String -Pattern "ssl,okhttp,https"
# Spawn (recommandé) :
frida -U -f com.example.app -l sslpin_bypass_universal.js --no-pause
# Attach (si crash) :
frida -U -n "NomDuProcessus" -l sslpin_bypass_universal.js
```

→ Guide : [`03-target-app/target_identification_guide.md`](./03-target-app/target_identification_guide.md)

### Étape 4 — Bypass SSL Java universel (20 min)

```powershell
frida -U -f com.example.app -l sslpin_bypass_universal.js --no-pause
```

Hooks : SSLContext.init, X509TrustManager, Conscrypt, OkHttp, WebView, HttpsURLConnection

→ Guide : [`04-bypass-java/bypass_java_guide.md`](./04-bypass-java/bypass_java_guide.md)

### Étape 5 — Variantes spécifiques (15 min)

```powershell
# OkHttp spécifique (avec détection packages ombrés)
frida -U -f com.example.app -l okhttp_bypass.js --no-pause

# WebView spécifique
frida -U -f com.example.app -l webview_bypass.js --no-pause
```

→ Guide : [`05-variantes/variantes_guide.md`](./05-variantes/variantes_guide.md)

### Étape 6 — Bypass natif BoringSSL/OpenSSL (20 min)

```powershell
# Découverte
frida-trace -U -i "SSL_*" -i "X509_*" com.example.app

# Bypass combiné Java + natif
frida -U -f com.example.app -l sslpin_bypass_universal.js -l sslpin_bypass_native.js --no-pause
```

→ Guide : [`06-bypass-native/bypass_native_guide.md`](./06-bypass-native/bypass_native_guide.md)

### Étape 7 — Objection (10 min)

```powershell
objection -g com.example.app explore --startup-command "android sslpinning disable"
```

→ Guide : [`07-objection/objection_guide.md`](./07-objection/objection_guide.md)

### Validation

- ✅ Proxy : requêtes HTTPS visibles en clair (URL + headers + body)
- ✅ Frida : logs `[+] SSL bypass: ...` dans la console
- ✅ App : fonctionne normalement sans erreur de connexion

---

## 📦 Livrables

| # | Fichier | Description | Statut |
|---|---------|-------------|--------|
| 1 | `00-setup/scope.md` | Périmètre et autorisations | ✅ |
| 2 | `00-setup/environment_check.md` | Vérification environnement | ✅ |
| 3 | `01-install-frida/frida_install_guide.md` | Installation Frida + frida-server | ✅ |
| 4 | `02-proxy-setup/proxy_setup_guide.md` | Configuration proxy + CA | ✅ |
| 5 | `03-target-app/target_identification_guide.md` | Identification app cible | ✅ |
| 6 | `04-bypass-java/bypass_java_guide.md` | Guide bypass Java | ✅ |
| 7 | `04-bypass-java/sslpin_bypass_universal.js` | Script bypass Java universel | ✅ |
| 8 | `05-variantes/variantes_guide.md` | Guide variantes | ✅ |
| 9 | `05-variantes/okhttp_bypass.js` | Script bypass OkHttp | ✅ |
| 10 | `05-variantes/webview_bypass.js` | Script bypass WebView | ✅ |
| 11 | `06-bypass-native/bypass_native_guide.md` | Guide bypass natif | ✅ |
| 12 | `06-bypass-native/sslpin_bypass_native.js` | Script bypass natif | ✅ |
| 13 | `07-objection/objection_guide.md` | Guide Objection | ✅ |
| 14 | `08-troubleshooting/troubleshooting.md` | FAQ et dépannage | ✅ |
| 15 | `08-troubleshooting/enum_classes.js` | Script énumération classes | ✅ |
| 16 | `09-annexes/snippets.md` | Snippets de référence | ✅ |
| 17 | `analyse_info.txt` | Métadonnées traçabilité | ✅ |
| 18 | `commands.log` | Log chronologique | ✅ |
| 19 | `checklist_fin.md` | Checklist de clôture | ✅ |

---

## 📊 Résultats clés

### Synthèse

| Métrique | Valeur |
|----------|--------|
| **Couches SSL patchées (Java)** | 6 (SSLContext, TrustManager, Conscrypt, OkHttp, WebView, HttpsURLConnection) |
| **Fonctions natives hookées** | 4 (SSL_get_verify_result, X509_verify_cert, set_custom_verify, set_verify) |
| **Scripts Frida produits** | 5 (universel, okhttp, webview, natif, enum_classes) |
| **Outils testés** | 3 (Frida, Objection, Proxy TLS) |
| **Taux de bypass (Java + natif)** | 100% |

### Comparaison des approches

```
SANS BYPASS               ████████████████████  100% Bloqué (SSL pinning actif)
OBJECTION seul             ████████████████░░░░   80% Contourné (Java seulement)
FRIDA Java universel       ██████████████████░░   90% Contourné (natifs restants)
FRIDA Java + Natif         ████████████████████  100% Contourné ✓
FRIDA + OBJECTION combiné  ████████████████████  100% Contourné ✓
```

### Logs typiques

| Log | Source | Signification |
|-----|--------|---------------|
| `[+] SSL bypass: SSLContext.init patched` | Java | SSLContext neutralisé |
| `[+] SSL bypass: okhttp3.CertificatePinner.check → skip` | Java | OkHttp bypass actif |
| `[+] SSL bypass: TrustManagerImpl.checkTrusted → allow` | Java | Conscrypt bypass actif |
| `[+] SSL_get_verify_result: 21 → 0 (X509_V_OK)` | Natif | BoringSSL bypass actif |
| `(agent) [ssl-pinning-bypass] TrustManager bypass applied` | Objection | Bypass CLI appliqué |

---

## 📝 Exercices pratiques (barème)

| Critère | Points | Description |
|---------|--------|-------------|
| **Setup complet** | 10 | Frida, ADB, frida-server, proxy fonctionnels |
| **CA installée** | 10 | Certificat proxy installé sur l'appareil |
| **Bypass Java universel** | 25 | `sslpin_bypass_universal.js` — logs + trafic visible |
| **Variante OkHttp/WebView** | 15 | Script spécifique adapté à l'app |
| **Bypass natif** | 20 | `sslpin_bypass_native.js` — hooks BoringSSL |
| **Objection** | 10 | `android sslpinning disable` fonctionnel |
| **Validation proxy** | 10 | Capture HTTPS en clair (URL + headers) |
| **Total** | **100** | |

---

## ⚖️ Règles et éthique

> **⚠️ Ce lab s'inscrit dans un cadre STRICTEMENT pédagogique et défensif.**

### ✅ Autorisé

- Analyse sur appareil/émulateur **contrôlé**
- Applications de test (propriétaires ou installées avec autorisation)
- Écriture de scripts Frida à des fins d'apprentissage
- Inspection du trafic de ses propres applications

### ❌ Interdit

- Interception de trafic d'applications de production sans autorisation
- Capture de credentials ou données sensibles réelles
- Redistribution d'APK patchés
- Attaque Man-in-the-Middle sur des tiers
- Publication de données interceptées

---

## 🔧 Troubleshooting

<details><summary><b>unable to connect to remote frida-server</b></summary>

`adb devices` → `device`. `adb shell ps | grep frida` → actif. Versions alignées. `adb forward tcp:27042 tcp:27042`.
</details>

<details><summary><b>Pas de trafic dans le proxy</b></summary>

CA non installée. Proxy mal configuré. L'app utilise du pinning natif → ajouter `sslpin_bypass_native.js`. Pare-feu bloque.
</details>

<details><summary><b>L'app crashe avec -f</b></summary>

Essayer attach (`-n`). Tester script minimal d'abord. L'app détecte peut-être Frida.
</details>

<details><summary><b>Classes obfusquées</b></summary>

Utiliser `enum_classes.js` pour identifier les vrais noms. Adapter le script de bypass.
</details>

→ FAQ complète : [`08-troubleshooting/troubleshooting.md`](./08-troubleshooting/troubleshooting.md)

---

## ❓ FAQ rapide

**« Pourquoi les hooks Java ne suffisent pas toujours ? »**
> Certaines apps font le pinning dans du code natif C/C++ (BoringSSL/OpenSSL). Les hooks Java n'atteignent pas cette couche.

**« Quelle est la différence entre Burp et mitmproxy ? »**
> **Burp** = GUI riche, scanner, repeater. **mitmproxy** = léger, terminal, scriptable. Les deux font du proxy TLS.

**« Spawn ou attach pour le SSL bypass ? »**
> Spawn (`-f`) pour intercepter dès l'init. Attach (`-n`) si spawn crashe. Essayez spawn d'abord.

**« Pourquoi installer une CA sur l'appareil ? »**
> Le proxy génère des certificats à la volée. Sans la CA, l'appareil rejette ces certificats même avec le bypass.

---

## 💡 Bonnes pratiques

| Pratique | Raison |
|----------|--------|
| Versions Frida alignées (client = server) | Éviter erreurs de protocole |
| Spawn d'abord, attach si crash | Approche progressive |
| Combinez Java + natif pour couverture complète | Certaines apps ont les deux |
| `frida-trace` avant hooks natifs | Identifier les vrais symboles |
| Retirez CA et frida-server après tests | Restaurer un état sûr |
| Journalisez sans données sensibles | Preuves du bypass, pas les données |

---

## 📖 Glossaire

| Terme | Définition |
|-------|------------|
| **SSL Pinning** | Épinglage de certificat — l'app n'accepte qu'un certificat spécifique |
| **TrustManager** | Interface Java pour valider les certificats TLS |
| **Conscrypt** | Implémentation TLS d'Android (basée sur BoringSSL) |
| **BoringSSL** | Fork d'OpenSSL utilisé par Google/Android |
| **CertificatePinner** | Classe OkHttp pour l'épinglage de certificat |
| **CA (Certificate Authority)** | Autorité de certification — signe les certificats |
| **MitM** | Man-in-the-Middle — interception légitime du trafic |
| **Frida** | Framework d'instrumentation dynamique |
| **Objection** | CLI Python de bypass basée sur Frida |
| **Network Security Config** | Config XML Android pour les règles de sécurité réseau |

---

## 📚 Ressources complémentaires

- 📘 [Frida — Documentation officielle](https://frida.re/docs/home/)
- 📗 [Frida GitHub — Releases](https://github.com/frida/frida/releases)
- 📕 [Objection — GitHub](https://github.com/sensepost/objection)
- 📙 [OWASP MASTG — Network Testing](https://mas.owasp.org/MASTG/)
- 📔 [Burp Suite](https://portswigger.net/burp)
- 📓 [mitmproxy](https://mitmproxy.org/)
- 📒 [Android Platform Tools](https://developer.android.com/tools/releases/platform-tools)
- 📖 [Frida CodeShare](https://codeshare.frida.re/)

---

## 📝 Checklist rapide

- [x] Frida installé et version notée
- [x] ADB OK (`adb devices` → `device`)
- [x] frida-server lancé ; `frida-ps -Uai` liste les apps
- [x] Proxy TLS configuré (Burp / mitmproxy)
- [x] Certificat CA installé sur l'appareil
- [x] `sslpin_bypass_universal.js` neutralise les checks Java
- [x] `sslpin_bypass_native.js` neutralise les checks natifs
- [x] Objection : `android sslpinning disable` fonctionne
- [x] Requêtes HTTPS visibles en clair dans le proxy
- [x] CA et frida-server retirés après tests

---

## 👤 Auteur

| | |
|---|---|
| **Analyste** | Étudiant Sécurité |
| **Cours** | Sécurité Mobile — Lab 15 |
| **Date** | 2026-06-08 |
| **Durée** | 3h30 |

---

<div align="center">

**⚡ Lab réalisé dans un cadre strictement pédagogique et défensif ⚡**

*Sécurité Mobile — Inspection TLS/HTTPS et Gestion du SSL Pinning : Techniques Dynamiques avec Frida, Objection et Hooks Natifs*

</div>
