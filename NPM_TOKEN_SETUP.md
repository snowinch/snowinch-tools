# 🔐 npm Token Setup Guide

npm ha introdotto nuovi sistemi di autenticazione più sicuri. Scegli l'opzione che preferisci:

---

## ✅ Opzione 1: Granular Access Token (Raccomandato)

**Vantaggi:**

- ✅ Facile da configurare
- ✅ Funziona subito
- ✅ Permessi granulari per pacchetto
- ✅ Token con scadenza configurabile

**Procedura:**

### 1. Crea il Token su npm

1. Vai su: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click **"Generate New Token"**
3. Seleziona **"Granular Access Token"**
4. Configura:

```
Token Name: GitHub Actions - snowinch-tools
Expiration: 1 year (o come preferisci)

Packages and scopes:
  ✅ Select packages: @snowinch/*
  ✅ Permissions: Read and write

Organizations: (se hai un'org npm)
  ✅ Seleziona la tua org se applicabile
```

5. Click **"Generate Token"**
6. **Copia il token** (inizia con `npm_`)

### 2. Aggiungi a GitHub Secrets

1. Vai su: `https://github.com/YOUR_ORG/snowinch-tools/settings/secrets/actions`
2. Click **"New repository secret"**
3. Configura:
   - Name: `NPM_TOKEN`
   - Secret: **incolla il token**
4. Click **"Add secret"**

### 3. ✅ Fatto!

Il workflow è già configurato per usare `NPM_TOKEN`.

---

## 🔒 Opzione 2: Trusted Publishing (Zero Token - Più Sicuro)

**Vantaggi:**

- ✅ **Zero token da gestire!**
- ✅ Massima sicurezza (OIDC)
- ✅ Provenance automatica
- ✅ Supply chain security

**Svantaggi:**

- ⚠️ Richiede setup iniziale più complesso
- ⚠️ Funziona solo da GitHub Actions
- ⚠️ Richiede che i pacchetti siano già pubblicati una volta

**Procedura:**

### 1. Pubblica la Prima Versione (con Token)

Devi pubblicare almeno una volta con un token per configurare il trusted publishing:

```bash
# Usa temporaneamente un Granular Access Token
npm login
npm publish packages/githubcron --access public
```

### 2. Configura Trusted Publishing su npm

1. Vai su: https://www.npmjs.com/package/@snowinch/githubcron/access
2. Nella sezione **"Publishing access"**
3. Click **"Configure trusted publishers"**
4. Aggiungi GitHub Actions:

```
Provider: GitHub Actions
Organization: YOUR_GITHUB_ORG
Repository: snowinch-tools
Workflow: .github/workflows/release.yml (opzionale)
Environment: (lascia vuoto o specifica se usi)
```

5. Click **"Add"**

### 3. Rimuovi NPM_TOKEN da GitHub Secrets

Vai su GitHub Secrets e **rimuovi** `NPM_TOKEN` (non serve più!)

### 4. Aggiorna il Workflow

Il workflow è già configurato con:

- ✅ `permissions: id-token: write` (per OIDC)
- ✅ `--provenance` flag nel publish

### 5. ✅ Fatto!

Da ora in poi le pubblicazioni avvengono **senza token**, usando l'identità di GitHub Actions verificata!

---

## 📊 Confronto

| Feature     | Granular Token     | Trusted Publishing  |
| ----------- | ------------------ | ------------------- |
| Setup       | ⭐ Facile          | ⭐⭐ Medio          |
| Sicurezza   | ⭐⭐ Alta          | ⭐⭐⭐ Massima      |
| Gestione    | Token da rinnovare | Zero manutenzione   |
| Provenance  | Opzionale          | Automatica          |
| Funziona da | Ovunque            | Solo GitHub Actions |

---

## 🎯 Raccomandazione

### Per Iniziare:

**Usa Granular Access Token** (Opzione 1)

- Setup in 5 minuti
- Funziona subito
- Puoi migrare dopo a Trusted Publishing

### Per Produzione Long-Term:

**Usa Trusted Publishing** (Opzione 2)

- Massima sicurezza
- Zero manutenzione
- Supply chain attestation

---

## 🔐 Provenance & Attestation

Con `--provenance` flag (già configurato), ogni pacchetto pubblicato avrà:

✅ **Provenance Statement** - Verifica che il pacchetto è stato buildato da GitHub Actions  
✅ **Build Attestation** - Link al workflow che ha buildato il pacchetto  
✅ **Transparency** - Gli utenti possono verificare l'origine del pacchetto

Esempio:

```bash
npm view @snowinch/githubcron --json | jq .dist.attestations
```

---

## 🆘 Troubleshooting

### Errore: "401 Unauthorized"

- Verifica che NPM_TOKEN sia settato in GitHub Secrets
- Verifica che il token abbia permessi di write sui pacchetti
- Verifica che il token non sia scaduto

### Errore: "403 Forbidden"

- Verifica di essere owner del package su npm
- Verifica che l'organizzazione npm sia corretta
- Verifica che il token abbia accesso all'org

### Errore: "Provenance failed"

- Verifica che `permissions: id-token: write` sia nel workflow
- Verifica che il workflow sia nella branch main
- Verifica che il repository sia pubblico (o configura org settings)

---

## 📚 Risorse

- [npm Granular Access Tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Changesets Provenance](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md#provenance)

---

**Creato**: 2025-11-16  
**Ultimo Aggiornamento**: 2025-11-16
