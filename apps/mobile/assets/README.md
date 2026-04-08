Place source assets here.

Suggested structure:

- `assets/images/` for `.png`, `.jpg`, `.webp`
- `assets/audio/` for `.mp3`, `.wav`, `.m4a`
- `assets/aseprite/` for `.aseprite` source files and exported sprite sheets

Example usage from app code:

```js
const shipImage = require("../assets/images/ship.png");
const laserSound = require("../assets/audio/laser.mp3");
```

Do not edit `dist/assets` directly. Expo rebuilds that folder automatically.

For Aseprite assets, keep the original `.aseprite` files in `assets/aseprite/source/`
and exported `.png` sheets in `assets/aseprite/exports/`.
