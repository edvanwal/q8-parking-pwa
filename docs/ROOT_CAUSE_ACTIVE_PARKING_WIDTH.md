# Root Cause Analysis: Active Parking Card – Breedteprobleem (Text Wrapping)

## Symptoom

In de "Active parking" kaart breken teksten ongewenst af op meerdere regels:

- **Kenteken** (bijv. G-346-VN): "G-346-" op regel 1, "VN" op regel 2
- **End-tijd** ("Until stopped"): breekt eveneens af

## Root Cause

### 1. Layout-structuur

```
active-parking-overlay (padding: 12px, full width)
└── active-parking-card (margin: 0 -12px, padding: 24px)
    └── ROW 1: flex justify-between items-start
        ├── LEFT: div.flex-1  [zone badge + plate]
        │   └── flex items-center gap-sm
        │       ├── zone-badge-box (P + 3200)  ~72px
        │       └── #active-plate-label        ~80px
        └── RIGHT: timer (text-right)          ~60px

    └── ROW 2: flex justify-between items-center
        ├── LEFT: "Start: 18:44"
        └── RIGHT: flex gap-sm
            ├── "End: " + #lbl-end (Until stopped)
            └── buttons (-) (+)
```

### 2. Oorzaak A: Klasse `flex-1` bestaat niet

- `flex-1` wordt in HTML gebruikt maar is **niet gedefinieerd** in `design-system.css`.
- Zonder `flex: 1 1 0%` gedraagt de linkerkolom zich als gewone content, maar de layout blijft flexbox.

### 3. Oorzaak B: Geen bescherming tegen text wrapping

- `#active-plate-label` en `#lbl-end` hebben geen `white-space: nowrap`.
- Standaard `white-space: normal` zorgt ervoor dat teksten mogen wrappen bij beperkte breedte.

### 4. Oorzaak C: Flex-shrinking

- In `flex items-center gap-sm` zijn zone-badge en plate flex-children.
- Default `flex-shrink: 1` laat de plate-div inkrimpen als er weinig ruimte is.
- De tekst in de plate-div wrapt zodra de div smaller wordt dan de intrinsieke breedte van de tekst.

### 5. Oorzaak D: Smalle viewports

- Op 320px–374px: `active-parking-card` heeft `padding: 16px` → contentbreedte ~288px.
- Op 481px+: overlay heeft `max-width: 480px` en is gecentreerd.
- De combinatie zone badge + plate + timer kan op smalle schermen net te krap zijn, wat shrinking en wrapping triggert.

## Oplossing

1. **`white-space: nowrap`** op kenteken en end-label zodat ze nooit wrappen.
2. **`flex-shrink: 0`** op de plate-label zodat het kenteken niet inkrimpt.
3. **`min-width: 0`** op de container van plate + zone (optioneel) om correcte flex-berekening te behouden.
4. **Definieer `flex-1`** correct indien de linkerkolom moet groeien/krimpen (nu niet kritiek, maar wenselijk voor robuustheid).

## Aanbevolen CSS-wijzigingen

```css
/* Kenteken en end-tijd niet laten wrappen */
#active-plate-label,
#lbl-end {
  white-space: nowrap;
}
#active-plate-label {
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis; /* alleen bij extreme overflow */
}

/* Of: hele zone+plate rij niet laten wrappen */
.active-parking-card .flex.items-center {
  flex-wrap: nowrap;
}
.active-parking-card .flex.items-center > div:last-child {
  white-space: nowrap;
  min-width: 0; /* laat ellipsis werken indien nodig */
}
```
