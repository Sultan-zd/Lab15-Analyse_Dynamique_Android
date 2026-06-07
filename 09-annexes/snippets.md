# 📎 Annexes — Snippets de référence

## Commandes ADB essentielles

```powershell
# Connexion et appareil
adb devices                                    # Lister les appareils
adb shell getprop ro.product.cpu.abi           # Architecture CPU
adb shell getprop ro.build.version.sdk         # Version API Android

# Transfert de fichiers
adb push <local> /data/local/tmp/              # PC → appareil
adb pull /sdcard/screenshot.png .              # Appareil → PC

# Redirection réseau
adb reverse tcp:8080 tcp:8080                  # Appareil → PC (proxy)
adb forward tcp:27042 tcp:27042                # PC → appareil (Frida)

# Shell
adb shell pm list packages                     # Lister les packages
adb shell pm list packages -3                  # Packages tiers uniquement
adb shell dumpsys package <pkg>                # Infos détaillées d'un package
```

## Commandes Frida essentielles

```powershell
# Lister les apps
frida-ps -Uai                                 # USB, toutes les apps (installées)
frida-ps -Ua                                  # USB, apps en cours d'exécution

# Injection
frida -U -f <pkg> -l script.js --no-pause     # Spawn + script
frida -U -n "Nom" -l script.js                # Attach par nom
frida -U -p <PID> -l script.js                # Attach par PID

# Multi-scripts
frida -U -f <pkg> -l a.js -l b.js --no-pause  # Deux scripts

# One-liner
frida -U -n "Nom" -e "console.log(Java.available)"

# Tracer les fonctions natives
frida-trace -U -i "SSL_*" <pkg>               # Tracer SSL_*
frida-trace -U -i "X509_*" <pkg>              # Tracer X509_*
```

## Commandes Objection essentielles

```powershell
# Lancement
objection -g <pkg> explore                     # Attach
objection -g <pkg> explore --startup-command "android sslpinning disable"

# Dans le shell Objection
android sslpinning disable                     # Bypass SSL
android hooking list classes                   # Lister les classes
android hooking search classes ssl             # Chercher "ssl"
android hooking search classes trust           # Chercher "trust"
android hooking search classes pin             # Chercher "pin"
android hooking list class_methods <class>     # Méthodes d'une classe
android hooking watch class <class>            # Surveiller une classe
env                                            # Chemins de l'app
```

## Snippets Frida (JavaScript)

### Énumérer les classes chargées

```javascript
Java.perform(function(){
  Java.enumerateLoadedClasses({
    onMatch: function(name){
      var s = name.toLowerCase();
      if (s.includes('okhttp') || s.includes('pin') || s.includes('trust') || s.includes('ssl'))
        console.log(name);
    },
    onComplete: function(){ console.log('--- done ---'); }
  });
});
```

### Lister les méthodes d'une classe

```javascript
Java.perform(function(){
  var cls = Java.use('com.example.ClassName');
  var methods = cls.class.getDeclaredMethods();
  methods.forEach(function(m){ console.log(m.toString()); });
});
```

### Lister les modules natifs

```javascript
Process.enumerateModules().forEach(function(m){
  if(m.name.includes('ssl') || m.name.includes('crypto'))
    console.log(m.name, m.base, m.size);
});
```

### Lister les exports d'un module natif

```javascript
Module.enumerateExports('libssl.so').forEach(function(e){
  if(e.name.includes('verify') || e.name.includes('cert'))
    console.log(e.type, e.name, e.address);
});
```

## Proxy — Commandes mitmproxy

```powershell
# Lancement
mitmproxy -p 8080                              # Terminal interactif
mitmweb -p 8080                                # Interface web
mitmdump -p 8080 -w traffic.flow               # Dump vers fichier

# Avec script Python
mitmdump -p 8080 -s modify_request.py          # Script de modification
```

## Certificats — Conversion OpenSSL

```powershell
# DER → PEM
openssl x509 -inform DER -in cert.cer -out cert.pem

# PEM → DER
openssl x509 -inform PEM -in cert.pem -outform DER -out cert.cer

# Afficher les infos d'un certificat
openssl x509 -in cert.pem -text -noout

# Hash pour CA système Android
openssl x509 -inform PEM -subject_hash_old -in cert.pem | head -1
# Résultat : <hash>.0 → renommer le fichier et placer dans /system/etc/security/cacerts/
```

---

## Références rapides

| Ressource | URL |
|-----------|-----|
| Frida Docs | https://frida.re/docs/home/ |
| Frida Releases | https://github.com/frida/frida/releases |
| Objection | https://github.com/sensepost/objection |
| OWASP MASTG Network | https://mas.owasp.org/MASTG/ |
| Burp Suite | https://portswigger.net/burp |
| mitmproxy | https://mitmproxy.org/ |
| Android Platform Tools | https://developer.android.com/tools/releases/platform-tools |
