# Implementation Plan: History Filters

## Goal

Add filtering functionality to the Parking History screen to allow users to filter regular parking sessions by **Vehicle** and **Date Range**, matching the provided design.

## 1. State Management (`Q8.State`)

We will extend the global state to track active filter settings.

```javascript
// New State Property
historyFilters: {
    active: false, // Toggle for UI visibility (optional, handled by activeOverlay)
    vehicles: [],  // Array of strings (e.g. ['1-ABC-123'])
    dateRange: 'all', // 'all' | 'week' | '30days' | 'custom'
    customStart: null, // Date object or ISO string
    customEnd: null    // Date object or ISO string
}
```

## 2. UI Components (`Q8.UI`)

### A. Filter Trigger Button

- **Location:** Fixed at the bottom of the `#view-history` screen (sticky footer).
- **Design:** Full-width outline button or floating style.
- **Action:** Opens the Filter Bottom Sheet.

### B. Filter Bottom Sheet (`#sheet-filters`)

- **Header:** Title "Filters".
- **Vehicle Section:**
  - Label: "VEHICLE"
  - Component: scrollable list of "Pills".
  - Interaction: Multi-select. Tapping a pill toggles its `selected` state.
- **Date Range Section:**
  - Label: "DATE RANGE"
  - Component: Row of pills: "Last Week", "Last 30 Days", "Custom Range".
  - Interaction: Single-select.
- **Footer:**
  - "Clear All" (Secondary/Outline)
  - "Apply" (Primary/Blue)

## 3. Logic & Filtering (`Q8.App` & `Q8.UI`)

### Filtering Logic (`renderHistory`)

The `renderHistory` function in `ui.js` will be updated to filter the `state.history` array before mapping it to HTML.

1.  **Vehicle Filter:**
    - If `state.historyFilters.vehicles` is empty, show all vehicles.
    - Else, include item only if `item.plate` is in the `vehicles` array.

2.  **Date Filter:**
    - **Last Week:** `item.end > (now - 7 days)`
    - **Last 30 Days:** `item.end > (now - 30 days)`
    - **Custom:** (Future scope: Date picker integration, for now placeholder or simple input).

### Event Handlers (`app.js`)

- `click [data-action="open-filters"]`: Set `state.activeOverlay = 'sheet-filters'`.
- `click [data-action="toggle-filter-vehicle"]`: Add/Remove ID from state.
- `click [data-action="set-filter-date"]`: Set `state.historyFilters.dateRange`.
- `click [data-action="apply-filters"]`: Render history, close overlay.
- `click [data-action="clear-filters"]`: Reset state, render history.

## 4. Verification

- Verify "Clear All" resets selection.
- Verify "Apply" correctly hides non-matching items.
- Verify multiselect works for vehicles.
