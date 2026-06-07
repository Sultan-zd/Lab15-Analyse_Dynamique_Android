# 🔧 Objection — Bypass SSL Pinning rapide

## Objectif

Utiliser Objection (CLI Python basée sur Frida) pour désactiver le SSL pinning en une seule commande.

---

## Installation

```powershell
pip install --upgrade objection
objection --version    # → 1.11.0+
```

---

## Utilisation

### Bypass au lancement (spawn)

```powershell
objection -g com.example.app explore --startup-command "android sslpinning disable"
```

### Bypass sur app en cours (attach)

```powershell
# Lancer l'app manuellement, puis :
objection -g com.example.app explore
# Dans le shell Objection :
android sslpinning disable
```

---

## Commandes utiles dans le shell Objection

| Commande | Description |
|----------|-------------|
| `android sslpinning disable` | Désactive le SSL pinning (TrustManager + OkHttp) |
| `android hooking list classes` | Liste toutes les classes chargées |
| `android hooking search classes ssl` | Cherche les classes contenant "ssl" |
| `android hooking search classes trust` | Cherche les classes contenant "trust" |
| `android hooking search classes pin` | Cherche les classes contenant "pin" |
| `android hooking list class_methods <class>` | Liste les méthodes d'une classe |
| `android hooking watch class <class>` | Surveille les appels à une classe |
| `env` | Affiche les chemins de l'app (data, cache, etc.) |
| `exit` | Quitter Objection |

---

## Ce que fait `android sslpinning disable`

Objection applique automatiquement des hooks sur :

1. **SSLContext.init** — Injection d'un TrustManager permissif
2. **TrustManagerImpl.checkTrustedRecursive** — Bypass Conscrypt
3. **TrustManagerImpl.verifyChain** — Bypass chaîne de certificats
4. **OkHTTP CertificatePinner.check** — Bypass OkHttp

> C'est essentiellement une version simplifiée du script `sslpin_bypass_universal.js`.

---

## Logs attendus

```
(agent) [ssl-pinning-bypass] Registering job. Started TrustManager bypass
(agent) [ssl-pinning-bypass] TrustManager bypass applied
(agent) [ssl-pinning-bypass] OkHTTP CertificatePinner bypass applied
```

---

## Limitations

| Limitation | Solution |
|------------|----------|
| Pas de bypass natif | Combiner avec `sslpin_bypass_native.js` via Frida |
| Pas de bypass WebView | Utiliser `webview_bypass.js` |
| Classes obfusquées non détectées | Utiliser le script universel Frida |

---

## Combinaison Objection + Frida natif

```powershell
# Terminal 1 : Objection
objection -g com.example.app explore --startup-command "android sslpinning disable"

# Terminal 2 : Frida natif (si nécessaire)
frida -U -n "AppName" -l sslpin_bypass_native.js
```

---

## Résumé

| Aspect | Détail |
|--------|--------|
| Outil | Objection 1.11.0 |
| Commande clé | `android sslpinning disable` |
| Couverture | TrustManager, Conscrypt, OkHttp |
| Avantage | Une seule commande, pas de script à écrire |
| Inconvénient | Pas de bypass natif, pas de WebView |
