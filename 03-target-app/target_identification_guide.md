# 🎯 Étape 3 — Lancer l'app cible sous Frida

## Objectif

Identifier l'application cible, comprendre les deux modes d'injection Frida (spawn vs attach), et lancer l'app avec le script de bypass SSL pinning.

---

## 3.1 Identifier le package de l'app cible

### Lister toutes les apps installées

```powershell
frida-ps -Uai
```

**Résultat** : liste complète des apps avec PID (si en cours), nom et identifiant de package.

### Filtrer par mots-clés (PowerShell)

```powershell
# Recherche par mot-clé
frida-ps -Uai | Select-String -Pattern "okhttp|webview|ssl|https|bank|secure"

# Exemples de résultats
#  PID  Name              Identifier
# ----  ----------------  ---------------------------------
# 1542  MySecureApp       com.example.secureapp
#    -  OkHttp Demo       com.squareup.okhttp.demo
```

### Identifier manuellement

```powershell
# Lister les packages via ADB
adb shell pm list packages | findstr "example"

# Obtenir le nom d'activité principale
adb shell dumpsys package com.example.app | findstr "Activity"
```

---

## 3.2 Modes d'injection Frida

### Mode Spawn (`-f`) — Injection au démarrage

```powershell
frida -U -f com.example.app -l sslpin_bypass_universal.js --no-pause
```

| Paramètre | Rôle |
|-----------|------|
| `-U` | Connexion USB |
| `-f <package>` | Spawn : lancer l'app et injecter immédiatement |
| `-l <script>` | Charger un script JavaScript |
| `--no-pause` | Ne pas mettre en pause au démarrage |

**Avantages** :
- Injection très tôt → intercepte les vérifications SSL dès l'initialisation
- Recommandé quand le pinning est fait au démarrage de l'app

**Inconvénients** :
- Peut faire crasher certaines apps sensibles
- Plus lent (redémarrage de l'app)

### Mode Attach (`-n` ou `-p`) — Injection sur un processus existant

```powershell
# Par nom de processus
frida -U -n "MySecureApp" -l sslpin_bypass_universal.js

# Par PID
frida -U -p 1542 -l sslpin_bypass_universal.js
```

**Avantages** :
- Moins intrusif
- Utile si spawn crashe l'app

**Inconvénients** :
- Injection tardive → les connexions SSL déjà établies ne sont pas interceptées
- Le pinning peut être vérifié avant l'injection

### Recommandation

```
┌───────────────────────────────────────────────┐
│  1. Essayer SPAWN (-f) en premier             │
│  2. Si crash → essayer ATTACH (-n)            │
│  3. Si pinning échappe → combiner les deux    │
│     avec un script qui attend les classes     │
└───────────────────────────────────────────────┘
```

---

## 3.3 Charger plusieurs scripts

```powershell
# Java + natif combiné
frida -U -f com.example.app \
  -l sslpin_bypass_universal.js \
  -l sslpin_bypass_native.js \
  --no-pause
```

Les scripts sont chargés dans l'ordre. Les hooks des deux scripts sont actifs simultanément.

---

## 3.4 REPL interactive Frida

Après l'injection, Frida ouvre une console interactive (REPL) :

```javascript
// Vérifier que Java est disponible
Java.available
// → true

// Lister les classes chargées contenant "ssl"
Java.perform(function(){
  Java.enumerateLoadedClasses({
    onMatch: function(name){
      if(name.toLowerCase().includes('ssl')) console.log(name);
    },
    onComplete: function(){ console.log('--- done ---'); }
  });
});
```

---

## 3.5 Vérification

| Critère | Attendu |
|---------|---------|
| `frida-ps -Uai` | L'app cible apparaît dans la liste |
| Injection spawn | Logs `[+] SSL bypass: ...` dans la console |
| Injection attach | Logs apparaissent lors des connexions réseau |
| Proxy | Les requêtes HTTPS commencent à apparaître |

---

## Résumé

| Mode | Commande | Cas d'usage |
|------|----------|-------------|
| Spawn | `frida -U -f <pkg> -l script.js --no-pause` | Pinning au démarrage |
| Attach | `frida -U -n "<nom>" -l script.js` | App déjà lancée / spawn crashe |
| Multi-scripts | `-l script1.js -l script2.js` | Java + natif combiné |
