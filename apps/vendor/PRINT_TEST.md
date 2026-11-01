# Receipt printer test (Phase 2)

Decides how the POS prints receipts. Spec: `docs/PRODUCT_SPEC_AND_ANALYSIS.md` §1.5 (Arabic on thermal printers) and §6.2.

## Run it

In the vendor desktop app: **Paramètres → Appareils → Ticket de caisse**.

```bash
npm install
npm run electron:dev -w @albaz/vendor
```

Choose the printer, paper and language there. In the tests below, **Print B (raster)** = mode "Image ESC/POS" +
"Imprimer un essai", **Print A (driver)** = mode "Pilote Windows" + "Imprimer un essai", **Open drawer** = "Ouvrir le
tiroir". After a real sale, "Imprimer le reçu" prints the same receipt with the sale's lines.

Network printers (test 9) are only in the old test screen of the retired `apps/pos` app
(`git checkout pos-vendor-reuse`, `npm run start -w @albaz/pos`); the print code is the same.

Without a printer, on the current code: `npm run selftest:desktop -w @albaz/vendor` writes PNGs and raw ESC/POS `.bin`
jobs for every language and paper width to `apps/vendor/smoke-data/selftest`.

## Before you start

- An 80 mm (or 58 mm) ESC/POS thermal printer, connected by USB with its Windows driver installed, **or** on the network (note its IP).
- Optional: a cash drawer plugged into the printer's RJ11/RJ12 "DK" port.
- Write down: printer brand/model, connection (USB/LAN), driver name.

## Tests

For each printer, tick what you see.

| # | Do | Pass when |
|---|----|-----------|
| 1 | Pick **Arabic + French**, 80 mm, **Print B: raster** | Arabic letters joined and right-to-left; French readable; numbers `12 500` correct; nothing cut off on the left or right |
| 2 | Same with **Arabic** only and **French** only | Same as 1 |
| 3 | **Print A: driver** with Arabic + French | Compare with 1: same content, nothing scaled tiny or cut off |
| 4 | Switch to 58 mm and print B (only on a 58 mm printer) | Fits the paper width |
| 5 | Look at the paper after 1 | Text dark enough, not smudged; paper is cut after the footer |
| 6 | **Open drawer** (Windows printer selected) | Drawer opens; nothing printed |
| 7 | Tick "Open drawer after printing", print B | Prints, cuts, then drawer opens |
| 8 | Printer off or unplugged, press print B | Clear error message in the app, app keeps working |
| 9 | Network printer only: choose **Network**, enter IP, print B and Open drawer | Same as 1 and 6 |
| 10 | Time from click to paper out (print B) | Under ~2 seconds |

## Report back

For each printer: model, connection, and which tests passed. Photos of the receipts from tests 1 and 3 are the most useful.

This decides:
- **Route B passes, A fails or looks worse** → the POS prints raster ESC/POS (the spec's default).
- **Both pass** → keep B as the default, keep A as a fallback for non-ESC/POS printers.
- **B fails on a printer** → note the model; it may not support `GS v 0` and needs the driver route.
