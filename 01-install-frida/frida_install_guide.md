# 🔧 Étape 1 — Installer Frida (PC) et démarrer frida-server (Android)

## 1.1 Installer Frida côté PC

### Installation

```powershell
# Installation recommandée via pip
python -m pip install --upgrade frida frida-tools

# Vérification CLI
frida --version
# Attendu : 16.5.9

# Vérification module Python
python -c "import frida; print(frida.__version__)"
# Attendu : 16.5.9
```

### Composants installés

| Outil | Rôle |
|-------|------|
| `frida` | Module Python — API programmatique |
| `frida-tools` | CLI : `frida`, `frida-ps`, `frida-trace`, `frida-discover` |

### Dépannage installation

| Problème | Solution |
|----------|----------|
| `frida: command not found` | Ajouter le dossier `Scripts/` de Python au PATH |
| Erreur de compilation | Installer Visual C++ Build Tools (Windows) |
| Version ancienne | `pip install --upgrade --force-reinstall frida frida-tools` |

---

## 1.2 Préparer ADB et l'appareil

### Activer le débogage USB

1. **Paramètres** → **À propos du téléphone** → Taper 7× sur **Numéro de build**
2. **Paramètres** → **Options développeur** → Activer **Débogage USB**
3. Brancher le câble USB → Accepter l'empreinte de débogage sur le téléphone

### Vérification ADB

```powershell
adb devices
```

**Résultats possibles** :

| Résultat | Signification | Action |
|----------|---------------|--------|
| `<serial>  device` | ✅ Connecté et autorisé | Continuer |
| `<serial>  unauthorized` | ⚠️ Pas encore autorisé | Accepter la popup USB sur le téléphone |
| `<serial>  offline` | ❌ Connexion instable | Débrancher/rebrancher, redémarrer adb |
| _(vide)_ | ❌ Aucun appareil | Vérifier câble, drivers, débogage USB |

```powershell
# Redémarrer ADB si nécessaire
adb kill-server
adb start-server
adb devices
```

---

## 1.3 Déployer et lancer frida-server

### Identifier l'architecture CPU

```powershell
adb shell getprop ro.product.cpu.abi
# Résultats courants : arm64-v8a, armeabi-v7a, x86_64, x86
```

### Télécharger frida-server

1. Aller sur https://github.com/frida/frida/releases
2. Chercher la version **identique** à `frida --version` (ex: 16.5.9)
3. Télécharger `frida-server-16.5.9-android-<arch>.xz`
4. Décompresser avec 7-Zip (Windows) ou `xz -d` (Linux/macOS)

> ⚠️ **CRITIQUE** : La version du client Frida (PC) doit être **exactement** la même que frida-server (Android). Sinon → erreur de connexion.

### Transférer et lancer

```powershell
# Transférer vers l'appareil
adb push frida-server-16.5.9-android-arm64 /data/local/tmp/frida-server

# Rendre exécutable
adb shell chmod 755 /data/local/tmp/frida-server

# Lancer frida-server (en arrière-plan)
adb shell "/data/local/tmp/frida-server -l 0.0.0.0 &"
```

### Optionnel : forwarding de ports

```powershell
# Si la connexion USB directe ne fonctionne pas
adb forward tcp:27042 tcp:27042
adb forward tcp:27043 tcp:27043
```

### Vérification

```powershell
# Lister les apps avec Frida
frida-ps -Uai
```

**Résultat attendu** : une liste des applications installées avec leur PID, nom et identifiant de package.

```
 PID  Name                    Identifier
----  ----------------------  ---------------------------------
 842  Paramètres              com.android.settings
1203  Chrome                  com.android.chrome
   -  YouTube                 com.google.android.youtube
  ...
```

### Arrêter frida-server

```powershell
adb shell "kill $(pidof frida-server)"
# OU
adb shell pkill frida-server
```

---

## Résumé

| Action | Commande | Résultat |
|--------|----------|----------|
| Installer Frida | `pip install frida frida-tools` | ✅ |
| Vérifier version | `frida --version` | `16.5.9` |
| Vérifier ADB | `adb devices` | `device` |
| Architecture | `getprop ro.product.cpu.abi` | `arm64-v8a` |
| Push server | `adb push frida-server ...` | ✅ |
| Lancer server | `adb shell "... &"` | ✅ |
| Vérifier | `frida-ps -Uai` | Liste apps |
