# 🌐 Étape 2 — Mettre en place le proxy et le certificat CA

## Objectif

Configurer un proxy TLS (Burp Suite ou mitmproxy) sur le PC, installer son certificat CA sur l'appareil Android, et rediriger le trafic de l'appareil vers le proxy.

---

## 2.1 Lancer le proxy sur le PC

### Option A : Burp Suite

1. Ouvrir **Burp Suite** (Community ou Pro)
2. Onglet **Proxy** → **Options** (ou **Settings**)
3. Vérifier le listener : `127.0.0.1:8080` (ou ajouter `0.0.0.0:8080` pour écouter sur toutes les interfaces)
4. Onglet **Proxy** → **Intercept** → **Intercept is off** (pour laisser passer le trafic automatiquement)

### Option B : mitmproxy

```powershell
# Installation
pip install mitmproxy

# Lancement
mitmproxy -p 8080

# OU avec l'interface web
mitmweb -p 8080
```

| Outil | Port par défaut | Interface | Avantage |
|-------|----------------|-----------|----------|
| Burp Suite | 8080 | GUI Java | Interface riche, repeater, scanner |
| mitmproxy | 8080 | Terminal / Web | Léger, scriptable, open-source |
| mitmweb | 8080 (proxy) + 8081 (web) | Navigateur | Visualisation web de mitmproxy |

---

## 2.2 Installer le certificat CA sur l'appareil

### Pourquoi ?

Le proxy TLS agit en **Man-in-the-Middle** (MitM) légitime. Il génère des certificats à la volée pour chaque domaine. L'appareil doit faire confiance à la CA du proxy pour ne pas rejeter ces certificats.

### Procédure

1. **Configurer temporairement le proxy Wi-Fi** sur l'appareil (voir 2.3)
2. Ouvrir le navigateur de l'appareil et naviguer vers :
   - Burp : `http://burp` → cliquer **CA Certificate**
   - mitmproxy : `http://mitm.it` → choisir **Android**
3. Télécharger le fichier `.cer` / `.pem`
4. **Paramètres** → **Sécurité** → **Installer un certificat** → **Certificat CA** → Sélectionner le fichier

### Vérification

**Paramètres** → **Sécurité** → **Certificats de confiance** → **Utilisateur** → Le certificat du proxy doit apparaître.

### Limitation Android 7+ (Network Security Config)

> ⚠️ **Android 7+** : par défaut, les applications ignorent les CA utilisateur et ne font confiance qu'aux CA système. C'est exactement pourquoi les hooks TrustManager/Conscrypt sont nécessaires.

| Android | CA utilisateur | CA système |
|---------|---------------|------------|
| < 7.0 | ✅ Confiance | ✅ Confiance |
| ≥ 7.0 | ❌ Ignorée par défaut | ✅ Confiance |
| ≥ 7.0 + hooks Frida | ✅ Forcée via bypass | ✅ Confiance |

---

## 2.3 Rediriger le trafic de l'appareil vers le proxy

### Méthode A : Proxy Wi-Fi (recommandée pour débuter)

1. **Appareil** et **PC** sur le **même réseau Wi-Fi**
2. Trouver l'IP du PC :
   ```powershell
   ipconfig    # Windows — chercher IPv4 Address
   ```
3. Sur l'appareil : **Paramètres** → **Wi-Fi** → Appui long sur le réseau → **Modifier** → **Proxy** → **Manuel**
   - **Hôte** : IP du PC (ex: `192.168.1.100`)
   - **Port** : `8080`
4. Enregistrer

### Méthode B : ADB reverse (USB, sans Wi-Fi commun)

```powershell
# Redirige le port 8080 du téléphone vers le PC
adb reverse tcp:8080 tcp:8080
```

Puis configurer le proxy de l'appareil sur `127.0.0.1:8080`.

### Méthode C : iptables (appareil rooté)

```bash
# Sur l'appareil (shell root)
iptables -t nat -A OUTPUT -p tcp --dport 443 -j DNAT --to-destination <IP_PC>:8080
iptables -t nat -A OUTPUT -p tcp --dport 80 -j DNAT --to-destination <IP_PC>:8080
```

### Validation

1. Naviguer vers un site HTTPS depuis le navigateur de l'appareil
2. Vérifier dans le proxy que la requête apparaît
3. **Note** : les apps avec SSL pinning afficheront des erreurs → c'est normal, le bypass sera appliqué à l'étape suivante

---

## Schéma de flux

```
┌──────────────┐     HTTPS      ┌──────────────┐    HTTPS     ┌──────────────┐
│   App        │ ─────────────▶ │   Proxy      │ ───────────▶ │   Serveur    │
│   Android    │                │  (Burp/mitm) │              │   distant    │
│              │ ◀───────────── │              │ ◀─────────── │              │
└──────────────┘   Cert proxy   └──────────────┘  Cert réel   └──────────────┘
                   (CA custom)                    (CA légitime)
```

**Sans bypass SSL** : l'app rejette le certificat du proxy → connexion échoue.  
**Avec bypass SSL** : les hooks Frida forcent l'acceptation → trafic visible en clair.

---

## Résumé

| Étape | Action | Statut |
|-------|--------|--------|
| 2.1 | Proxy lancé (Burp / mitmproxy) | ✅ |
| 2.2 | CA installée sur l'appareil | ✅ |
| 2.3 | Trafic redirigé vers le proxy | ✅ |
| Validation | Requête HTTP visible dans le proxy | ✅ |
