# 🔧 Dépannage (FAQ) — Lab 15

## Problèmes de connexion Frida

<details><summary><b>error: unable to connect to remote frida-server</b></summary>

1. Vérifier la connexion ADB :
   ```powershell
   adb devices    # → doit afficher "device"
   ```
2. Vérifier que frida-server tourne :
   ```powershell
   adb shell ps | findstr frida
   ```
3. **Versions alignées** : `frida --version` (PC) doit = version frida-server (Android)
4. Forwarding de ports :
   ```powershell
   adb forward tcp:27042 tcp:27042
   adb forward tcp:27043 tcp:27043
   ```
5. Relancer frida-server :
   ```powershell
   adb shell "kill $(pidof frida-server)"
   adb shell "/data/local/tmp/frida-server -l 0.0.0.0 &"
   ```

</details>

---

## Problèmes de proxy

<details><summary><b>Pas de trafic dans le proxy malgré les hooks</b></summary>

1. **CA non installée** : vérifier dans Paramètres > Sécurité > Certificats de confiance > Utilisateur
2. **Proxy mal configuré** : vérifier l'IP et le port dans les paramètres Wi-Fi de l'appareil
3. **Réseau différent** : PC et appareil doivent être sur le même réseau Wi-Fi
4. **Pare-feu** : désactiver temporairement le pare-feu Windows
5. **adb reverse** : si USB, exécuter `adb reverse tcp:8080 tcp:8080`
6. **L'app n'utilise pas le proxy** : certaines apps ignorent les paramètres proxy système → utiliser iptables ou ProxyDroid

</details>

<details><summary><b>Le proxy voit des requêtes HTTP mais pas HTTPS</b></summary>

1. Le bypass SSL n'est pas actif → vérifier les logs Frida
2. L'app utilise du pinning natif → ajouter `sslpin_bypass_native.js`
3. L'app utilise Cronet → hooks natifs nécessaires

</details>

---

## Problèmes d'injection Frida

<details><summary><b>L'app crashe au démarrage avec -f (spawn)</b></summary>

1. Essayer attach au lieu de spawn :
   ```powershell
   frida -U -n "NomDuProcessus" -l sslpin_bypass_universal.js
   ```
2. Tester d'abord un script minimal :
   ```powershell
   frida -U -f com.example.app -e "console.log('hello')" --no-pause
   ```
3. L'app détecte peut-être Frida → renommer frida-server, changer le port

</details>

<details><summary><b>Les hooks ne s'appliquent pas</b></summary>

1. Vérifier que `Java.available` est `true`
2. L'app n'a peut-être pas encore chargé les classes → utiliser spawn (`-f`)
3. Classes obfusquées → utiliser `enum_classes.js` pour trouver les vrais noms
4. Le timing est mauvais → ajouter un `setTimeout` dans le script

</details>

---

## Problèmes d'obfuscation

<details><summary><b>Classes SSL/OkHttp renommées</b></summary>

1. Énumérer les classes :
   ```powershell
   frida -U -f com.example.app -l enum_classes.js --no-pause
   ```
2. Chercher des patterns : `CertificatePinner`, `TrustManager`, `SSLContext`
3. Adapter les noms de classes dans le script de bypass

</details>

---

## Problèmes de certificat

<details><summary><b>Android refuse d'installer la CA</b></summary>

1. Le fichier doit être au format `.cer` ou `.pem`
2. Android 11+ : installer via **Paramètres > Sécurité > Chiffrement > Installer un certificat**
3. Certains constructeurs ont un chemin différent
4. Alternative : utiliser `adb push` + conversion OpenSSL pour installer comme CA système (nécessite root)

</details>

---

## Problèmes avancés

<details><summary><b>Cronet / Chromium bloque toujours</b></summary>

1. Tracer les symboles natifs SSL :
   ```powershell
   frida-trace -U -i "SSL_*" com.example.app
   ```
2. Chercher les classes Java Chromium :
   ```javascript
   Java.enumerateLoadedClasses({
     onMatch: function(n){ if(n.includes('chromium.net')) console.log(n); },
     onComplete: function(){}
   });
   ```
3. Combiner hooks Java + natif

</details>

<details><summary><b>WebView continue à bloquer</b></summary>

1. L'app utilise peut-être un WebViewClient personnalisé → `webview_bypass.js`
2. Vérifier que `setWebViewClient` est bien hookée
3. Tracer les erreurs dans la console JavaScript de la WebView

</details>

---

## Bonnes pratiques de diagnostic

| Étape | Action | Commande |
|-------|--------|----------|
| 1 | Vérifier Frida | `frida --version` + `frida-ps -Uai` |
| 2 | Tester injection | Script `console.log('hello')` |
| 3 | Identifier les classes | `enum_classes.js` |
| 4 | Script universel Java | `sslpin_bypass_universal.js` |
| 5 | Vérifier le proxy | Navigation web depuis l'appareil |
| 6 | Ajouter natif si besoin | `sslpin_bypass_native.js` |
| 7 | Variantes si besoin | `okhttp_bypass.js` / `webview_bypass.js` |
