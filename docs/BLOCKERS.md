# Blockers

Doel: niets stopt de voortgang zonder dat het hier staat.

## [FMT-001] format:check faalt op recovery-preview.html (pre-existing)

Impact: `npm run format:check` exit code 2; geen invloed op preflight of test:e2e:proof. index.html, public/index.html en ui.js (root + public) zijn gefixt.

Repro stappen:
1. Run `npm run format:check`.
2. Zie error: HTML "Unexpected closing tag div" in recovery-preview.html (rond regel 496).

Waar onderzocht:
- Bestand: recovery-preview.html (einde bestand). index.html/public/index.html: </div> na side-menu was </nav>; ui.js: key `'30days'` gequote.
- Observaties: In recovery-preview lijkt de div-nesting aan het einde niet te kloppen voor de HTML5-parser; oorzaak mogelijk eerder in bestand (implied end tags).

Wat nog nodig is om door te kunnen:
- recovery-preview.html: div-structuur handmatig nalopen en corrigeren, of bestand uitsluiten van format:check (.prettierignore) indien preview buiten scope.

Geen andere blockers. Autopilot stopcriteria bereikt (preflight PASS, canon groen, proof PASS).
