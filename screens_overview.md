# Overzicht van Applicatie Schermen

De applicatie is gebouwd als een **Single Page Application (SPA)**. Dit betekent dat er technisch gezien maar één URL is (`http://localhost:3000/`), en dat de navigatie wordt afgehandeld door JavaScript die verschillende secties ("views") toont of verbergt.

Hieronder vind je een overzicht van alle gerealiseerde schermen en hoe je ze kunt bereiken.

## Hoofdschermen (Views)

Deze schermen vormen de basisnavigatie.

| Scherm               | Interne State | Omschrijving                                                                                              |
| :------------------- | :------------ | :-------------------------------------------------------------------------------------------------------- |
| **Inloggen**         | `login`       | Het startscherm. Bevat e-mail/wachtwoord velden en taalwissel (NL/EN).                                    |
| **Registreren**      | `register`    | Formulier om een nieuw account aan te maken. Bereikbaar via "Account aanmaken" op het inlogscherm.        |
| **Parkeren (Kaart)** | `parking`     | Het hoofdscherm na inloggen. Toont de kaart, zoekbalk (Zones/Adres) en actieve sessies.                   |
| **Kentekens**        | `plates`      | Lijst van toegevoegde kentekens. Hier kun je kentekens toevoegen, verwijderen of als standaard instellen. |
| **Geschiedenis**     | `history`     | Overzicht van eerdere parkeersessies met datum, tijd, zone en kosten.                                     |

## Tijdelijke Schermen (Overlays & Modals)

Deze schermen liggen bovenop de hoofdschermen.

| Type                   | ID                     | Omschrijving                                                                                                       |
| :--------------------- | :--------------------- | :----------------------------------------------------------------------------------------------------------------- |
| **Menu**               | `menu-overlay`         | Zijmenu (Drawer) met navigatie naar Parkeren, Geschiedenis en Kentekens.                                           |
| **Zone Detail**        | `sheet-zone`           | "Bottom Sheet" die verschijnt als je op een marker of zoekresultaat klikt. Hier start je een sessie.               |
| **Filters**            | `sheet-filter`         | Filteropties op het Geschiedenis-scherm.                                                                           |
| **Kenteken Toevoegen** | `modal-add-plate`      | Pop-up venster om een nieuw kenteken in te voeren.                                                                 |
| **Snel Wisselen**      | `sheet-plate-selector` | "Action Sheet" in het parkeerscherm om snel van auto te wisselen (met beschrijving).                               |
| **Bevestiging**        | `modal-confirm`        | Bevestigingsvenster bij het stoppen van een parkeeractie.                                                          |
| **Install Gate**       | `install-gate`         | Speciaal iOS-scherm dat gebruikers forceert de app aan hun homescreen toe te voegen (alleen zichtbaar op iOS web). |

## Navigatie Structuur

De navigatie verloopt via interne statuswijzigingen in `app.js`:

1.  **Start** -> `Login`
2.  **Login** -> `Parking` (Na succesvolle login)
3.  **Parking** -> `Menu` -> `History` / `Plates`
4.  **Register** -> `Login` (Terugknop) of `Parking` (Na registratie)

> **Notitie**: Omdat het een SPA is, verandert de URL in de browserbalk niet tijdens het navigeren. Als je de pagina ververst (`F5`), wordt de status opnieuw geladen vanuit `localStorage` (sessie & kentekens), maar de app keert standaard terug naar de inlog- of parkeerstatus afhankelijk van de logica.
