# 🔍 Vérification de l'environnement — Lab 15

## Checklist de pré-requis

### 1. Python et pip

```powershell
python --version          # Attendu : Python 3.8+
pip --version             # Attendu : pip 24.x+
```

| Critère | Commande | Résultat attendu | Statut |
|---------|----------|-------------------|--------|
| Python installé | `python --version` | `Python 3.11.x` | ✅ |
| pip à jour | `pip --version` | `pip 24.x` | ✅ |

### 2. ADB (Android Debug Bridge)

```powershell
adb version               # Attendu : 1.0.41+
adb devices                # Attendu : <serial>  device
```

| Critère | Commande | Résultat attendu | Statut |
|---------|----------|-------------------|--------|
| ADB installé | `adb version` | `1.0.41` | ✅ |
| Appareil connecté | `adb devices` | `<serial>  device` | ✅ |
| Pas `unauthorized` | `adb devices` | Pas `unauthorized` | ✅ |

### 3. Frida (client PC)

```powershell
frida --version                                    # Attendu : 16.5.9
python -c "import frida; print(frida.__version__)" # Attendu : 16.5.9
```

| Critère | Commande | Résultat attendu | Statut |
|---------|----------|-------------------|--------|
| Frida CLI | `frida --version` | `16.5.9` | ✅ |
| Frida Python | `python -c ...` | `16.5.9` | ✅ |

### 4. frida-server (Android)

```powershell
adb shell getprop ro.product.cpu.abi     # → arm64-v8a
adb shell ls /data/local/tmp/frida-server
adb shell ps | findstr frida             # → processus actif
frida-ps -Uai                            # → liste des packages
```

| Critère | Commande | Résultat attendu | Statut |
|---------|----------|-------------------|--------|
| Architecture CPU | `getprop ro.product.cpu.abi` | `arm64-v8a` | ✅ |
| frida-server présent | `ls /data/local/tmp/frida-server` | Fichier existe | ✅ |
| frida-server actif | `ps \| grep frida` | PID affiché | ✅ |
| Communication OK | `frida-ps -Uai` | Liste d'apps | ✅ |

### 5. Proxy TLS

```powershell
# Burp Suite
# → Proxy > Options > Listening on 127.0.0.1:8080

# OU mitmproxy
mitmproxy --version                      # Attendu : 10.x+
```

| Critère | Commande | Résultat attendu | Statut |
|---------|----------|-------------------|--------|
| Proxy installé | Interface Burp / `mitmproxy --version` | Version affichée | ✅ |
| Port d'écoute | `127.0.0.1:8080` | Port ouvert | ✅ |

### 6. Objection (optionnel)

```powershell
pip install --upgrade objection
objection --version                      # Attendu : 1.11.0+
```

| Critère | Commande | Résultat attendu | Statut |
|---------|----------|-------------------|--------|
| Objection installé | `objection --version` | `1.11.0` | ✅ |

---

## Résumé

| Composant | Statut |
|-----------|--------|
| Python 3.8+ | ✅ |
| pip | ✅ |
| ADB | ✅ |
| Appareil Android | ✅ |
| Frida (client) | ✅ |
| frida-server | ✅ |
| Proxy TLS | ✅ |
| Objection | ✅ |

> **Environnement prêt pour le lab.**
