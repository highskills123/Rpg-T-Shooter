Aseprite pipeline for this project.

Put files here:

- `source/` for original `.aseprite` files
- `exports/characters/` for exported character sprite sheets
- `exports/projectiles/` for exported arrows, magic, and other shots

Expected character setup from your pack:

- canvas or slice size: `100 x 100`
- animation tags: `Idle`, `Walk`, `Attack01`, `Attack02`, `Attack03`, `Hurt`, `Death`
- layers commonly include: `shadow`, `main`, `effect`

Best export format for Expo:

1. Keep the original `.aseprite` file in `source/`
2. Export a `.png` sprite sheet
3. Export a `.json` data file with frame names if available

Recommended export naming:

- `soldier.png`
- `soldier.json`
- `knight.png`
- `knight.json`
- `arrow_01.png`

Recommended Aseprite export settings:

- Sheet type: `Packed` or `Rows`
- Trim: `off`
- Extrude: `0`
- Ignore empty: `off`
- Merge duplicates: `off`
- Border padding: `0`
- Shape padding: `0`
- Inner padding: `0`

If you only give me the `.aseprite` file, that is fine. I can still prepare the folder structure and wire the game around the exported sprite sheet you choose.
