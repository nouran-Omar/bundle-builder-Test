# Image assets

The catalog in `src/data/catalog.json` points at file paths in this folder
(e.g. `/images/wyze-cam-v4.png`). None of the real product photography could
be extracted automatically from the `.fig` file, so right now those paths
either resolve to nothing (the card falls back to a text label) or to the
placeholder SVGs already sitting here.

To finish the visuals:

1. Open the Figma file in the browser.
2. Select each product image layer → right panel → **Export** → PNG (2x).
3. Save it into this folder using the exact filename referenced in
   `catalog.json` (or update the JSON to match whatever you name the file).

Because everything renders from `catalog.json`, dropping in a correctly named
file is the only step required — no component code needs to change.
