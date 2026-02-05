# Toast-events overzicht

## Huidige triggers (na update)

### Success (groen)

- **Favorieten:** Toegevoegd/verwijderd uit favorieten
- **Parkeren:** Sessie gestart, sessie beëindigd
- **Kentekens:** Toegevoegd, bijgewerkt, verwijderd, standaard ingesteld
- **Export:** CSV gedownload, printdialoog geopend
- **Auth:** Resetlink verzonden
- **Connectie:** Verbinding hersteld, app geïnstalleerd

### Error (rood)

- **Parkeren:** Geen zone geselecteerd, zone niet beschikbaar, parkeren niet toegestaan (dag/tijd)
- **Kentekens:** Validatiefouten (formaat, te lang, al bestaand)
- **Auth:** Inlog/registratie-fouten, wachtwoorden komen niet overeen
- **Connectie:** Offline

### Default (Q8 blauw)

- Notificaties vanuit addNotification (sessionStarted, sessionExpiringSoon, etc.) – deze tonen ook toast naast de notificatielijst

## Nieuwe toasts toegevoegd

- Print/PDF export: "Printdialoog geopend"
- Wachtwoord reset succes: "Resetlink verzonden"
- Wachtwoord reset fout: toast bij catch
- Offline/online: NL vertaling + type

## Styling

- **Q8-blauw** (default): `--q8-blue-900`
- **Success:** `--success` (groen)
- **Error:** `--danger` (rood)
- Position: bottom-center, boven safe area
- Animatie: slide up + scale, 3000ms weergave (4000ms bij lange tekst)
