# 📋 Takenlijst: Firebase Migratie

Deze lijst houdt de voortgang bij van de transformatie van de static PWA naar een volledige Firebase-applicatie.

- [x] **Firebase Project Configuratie**
  - [x] Project aanmaken in Console
  - [x] Web App registreren
  - [x] Firestore Database inschakelen
  - [x] Authentication (Email/Password) inschakelen
- [x] **Frontend Integratie**
  - [x] `firebase-config.js` aangemaakt en API keys gecorrigeerd
  - [x] Firebase SDK scripts toevoegen aan `index.html`
  - [x] Authenticatie logica (Login/Register/Logout) implementeren in `app.js`
- [ ] **Database Migratie (Firestore)**
  - [x] Fetch logica in `app.js` ombouwen naar Firestore (`db.collection('zones')`)
  - [x] `fetch_rdw_data.py` updaten (`firebase-admin` SDK)
  - [x] Service Account JSON downloaden en geplaatst in root map
- [x] **Python Setup**
  - [x] `pip install firebase-admin` uitgevoerd
- [x] **Data Vulling**
  - [x] Cloud Firestore API ingeschakeld
  - [x] Script gedraaid om live RDW zones naar Firestore te synchroniseren
- [ ] **Validatie**
  - [ ] Testen: Registreren nieuwe gebruiker
  - [ ] Testen: Inloggen & Uitloggen
  - [ ] Testen: Zones zichtbaar op kaart (uit Firestore)
