# 🔒 Périmètre d'analyse — Lab 15

## Contexte

| Champ | Valeur |
|-------|--------|
| **Lab** | 15 — Analyse Dynamique Android : Inspection TLS/HTTPS & SSL Pinning |
| **Type** | Instrumentation dynamique — Inspection du trafic réseau |
| **Date** | 2026-06-08 |
| **Analyste** | Étudiant Sécurité |
| **Cadre** | Pédagogique — Cours de Sécurité Mobile |

## Objectif

Intercepter et inspecter le trafic HTTPS d'une application Android en contournant les mécanismes d'épinglage de certificat (SSL Pinning) à l'aide d'outils d'instrumentation dynamique.

## Périmètre

### ✅ Inclus

- Applications Android de test (propriétaires ou installées sur appareil contrôlé)
- Appareil Android personnel avec débogage USB activé
- Certificats CA de proxy (Burp Suite / mitmproxy)
- Scripts Frida pour bypass SSL pinning (Java & natif)
- Hooks : SSLContext, TrustManager, Conscrypt, OkHttp, WebView, BoringSSL

### ❌ Exclus

- Applications de production en contexte réel (sans autorisation)
- Données utilisateur réelles
- Exfiltration ou stockage de credentials interceptés
- Redistribution d'APK patchés
- Attaque Man-in-the-Middle sur des tiers

## Autorisations

- [x] Appareil Android personnel utilisé
- [x] Application cible : app de test / propriétaire
- [x] Cadre académique validé
- [x] Aucune donnée réelle exposée

## Référentiel

| Standard | Section |
|----------|---------|
| OWASP MASVS v2.0 | MASVS-NETWORK |
| OWASP MASTG | MASTG-TEST-0217 (Network Communication) |
| OWASP MASTG | MASTG-TEST-0218 (Certificate Pinning) |

## Risques identifiés

| Risque | Mitigation |
|--------|------------|
| Exposition de données sensibles | Utiliser uniquement des apps de test |
| CA malveillante persistante | Retirer le certificat après le lab |
| frida-server ouvert en réseau | Limiter au localhost ou retirer après usage |
| Perte de garantie appareil | Utiliser un appareil de test dédié |
