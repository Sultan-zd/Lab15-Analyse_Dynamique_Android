# 📋 Checklist de clôture — Lab 15

> **Lab** : Analyse Dynamique Android — Inspection TLS/HTTPS & SSL Pinning  
> **Date** : 2026-06-08  
> **Analyste** : Étudiant Sécurité

---

## ✅ Environnement

- [x] Python 3.8+ installé et fonctionnel
- [x] pip à jour
- [x] ADB installé et appareil reconnu (`device`)
- [x] Frida installé (`frida --version` = 16.5.9)
- [x] frida-server déployé et lancé sur l'appareil
- [x] `frida-ps -Uai` retourne la liste des apps

## ✅ Proxy TLS

- [x] Proxy (Burp / mitmproxy) installé et configuré sur le PC
- [x] Certificat CA exporté et installé sur l'appareil
- [x] Trafic de l'appareil redirigé vers le proxy (Wi-Fi ou `adb reverse`)
- [x] Navigation HTTP/HTTPS basique visible dans le proxy

## ✅ Scripts SSL Pinning Bypass

- [x] `sslpin_bypass_universal.js` — bypass Java universel créé et testé
- [x] `sslpin_bypass_native.js` — bypass natif BoringSSL/OpenSSL créé
- [x] `okhttp_bypass.js` — bypass OkHttp spécifique créé
- [x] `webview_bypass.js` — bypass WebView créé
- [x] `enum_classes.js` — script d'énumération des classes créé

## ✅ Validation

- [x] Requêtes HTTPS de l'app visibles en clair dans le proxy
- [x] Logs Frida `[+] SSL bypass: ...` observés
- [x] Mode spawn (`-f`) testé
- [x] Mode attach (`-n`) testé

## ✅ Objection

- [x] Objection installé et fonctionnel
- [x] `android sslpinning disable` exécuté avec succès

## ✅ Cas avancé (natif)

- [x] `frida-trace -U -i SSL_* -i X509_*` exécuté
- [x] Hook natif `SSL_get_verify_result` appliqué
- [x] Combinaison Java + natif testée

## ✅ Livrables

- [x] Tous les guides rédigés (Markdown)
- [x] Tous les scripts Frida créés et fonctionnels
- [x] `commands.log` renseigné
- [x] `analyse_info.txt` renseigné
- [x] `README.md` rédigé

## ✅ Nettoyage

- [x] frida-server arrêté sur l'appareil
- [x] Certificat CA retiré de l'appareil
- [x] Débogage USB désactivé (si nécessaire)
- [x] Proxy arrêté

---

**Signature** : _Étudiant Sécurité — Lab 15 complété le 2026-06-08_

> ⚠️ Ce lab a été réalisé dans un cadre **strictement pédagogique et défensif**.
