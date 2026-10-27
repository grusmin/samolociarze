Game rebuild entry point: `node model-sources/rebuild-concorde.cjs` from the game root. It regenerates the body-only files and copies them into dist/models/. The generated converted-body/ directory is not tracked.

# Concorde Air France and Boeing 737-800 Ryanair assets

Prepared for Samolociarze, 27 October 2026. This directory contains source assets and a deterministic conversion; no game checkout or repository metadata was changed by the asset task.

## Ready-to-use Concorde exterior

Copy **all four files** from `converted-body/` into the game's `dist/models/`:

- `conc.gltf` — glTF 2.0 scene, 24 KB approximately.
- `conc.bin` — 1,400,460-byte geometry buffer.
- `conc-airfrance.png` — 131,465-byte official Air France F-BVFB livery.
- `conc-default.png` — 188,485-byte original detail atlas for engine/nozzle parts.

The model has 41,841 triangles, 34 original mesh objects and five materials. Existing game material batching can combine identical material surfaces. Coordinates use metres, +Y up, wing span along X, nose toward -Z; dimensions are **25.56 m span × 61.66 m length**. The body-only vertical bounds are approximately -2.018 to +7.489 m before the game's normalisation.

All source wheel/strut parts, open undercarriage doors, duplicate closed-door alternatives, cockpit interior, cabin interior and flat afterburner cards are omitted. Add the game's own retractable undercarriage. The source nose is in its raised/straight position; this is a fixed exterior, without nose-droop animation.

The complete alternative with original static FlightGear undercarriage is in `converted/`, and should not be combined with generated gear. It has 63,325 triangles and 76 mesh objects.

## Source and licensing

Concorde is from the FlightGear / FGMEMBERS project:

- Repository: <https://github.com/FGMEMBERS/Concorde>
- Pinned commit: `af22b7012bec173884a259eb84da1c29de72c23f`.
- Exterior source: <https://github.com/FGMEMBERS/Concorde/blob/af22b7012bec173884a259eb84da1c29de72c23f/Models/concorde.ac>
- Air France livery: <https://github.com/FGMEMBERS/Concorde/blob/af22b7012bec173884a259eb84da1c29de72c23f/Models/Liveries/AF.png>
- Livery definition: `Models/Liveries/AF.xml` identifies it as **Air France**.
- Licence: **GNU GPL version 2**, preserved as `concorde-COPYING.txt`.
- Preserve `ReadmeModel.txt`, `Changelog.txt` and the upstream README for original contributor information. They credit model work to **C. Schmitt** and **E. Huminiuc**, with later maintenance by **godarklight** and **islandmonkey**. The upstream README says the original initial model author is unknown; no invented original author is assigned here.

All individual download URLs, source paths, sizes, commits and tree hashes are recorded in `SOURCES.json`. Keep the `.ac` source, converter, source textures, provenance and licence with the project's `model-sources/` when distributing the modified model.

## Conversion details

Run `node convert-concorde.cjs --body-only` in this directory. `node convert-concorde.cjs` rebuilds the optional native-gear variant.

The converter reads the AC3D vertex, polygon, UV, material and object hierarchy data directly; triangulates faces; computes smooth normals; preserves UV seams; indexes repeated vertex attributes; removes the excluded alternatives; rotates the source into the game axes; and writes glTF 2.0 with external PNG textures. Tiny upstream dimension differences are corrected by factors X = `25.56/24.642246` and Z = `61.66/61.769096`; Y is unchanged. Source colours and basic metallic/roughness properties are retained as PBR approximations.

AC3D UVs are converted as **(u, 1−v)**. This is correct for PNGs with the game's `GLTFLoader` using `flipY=false`. `texrep` is 1,1 and `texoff` is absent in this upstream model. As specified by `Concorde_ba.xml`, the Air France atlas is applied only to Hull, Upperrudder, Lowerrudder, Wing, Nose_0 and Nose_1; other exterior parts retain the default atlas. Cabin windows use an opaque dark-blue material so an omitted interior does not show through empty glass.

The upstream AC3D world declares 104 children but contains 103 actual objects. The converter tolerates this final stale count and imports every real child. It does not skip an actual source object because of that discrepancy.

## Validation and previews

The generated model was parsed successfully by the same Three.js GLTFLoader as the game, checking all position/normal/UV attributes and triangle counts. `CONVERSION-REPORT-BODY.json` lists every retained source object, material, dimension and triangle count.

`preview-textured-front.png`, `preview-textured-side.png`, and `preview-textured-rear.png` are software z-buffer projections with true per-pixel barycentric UV interpolation. They verify clean AIR FRANCE lettering, F-BVFB registration and tail stripes. Earlier files named simply `preview-front/side/rear.png` use a fast one-colour-per-triangle approximation and show texture mosaics; those are **not** a model UV defect. `preview-textured.py` reproduces the accurate preview using Python, NumPy and Pillow only; no browser or external renderer is required.

## Ryanair texture for the existing Boeing 737-800

- Ready source texture: `b738-ryanair.png`, 314,279 bytes.
- Source definition: `b738-ryanair.xml`, declaring **Ryanair**.
- Repository: <https://github.com/FGMEMBERS/737-800>
- Pinned commit: `9126249dd0236479ad723f3e7c4c7139455c7d81`.
- Texture: <https://github.com/FGMEMBERS/737-800/blob/9126249dd0236479ad723f3e7c4c7139455c7d81/Models/Liveries-800/RYR-800.png>
- Licence: **GNU GPL version 2**, preserved in `b738-LICENSE.txt`.

It is an official livery for the same FlightGear 737-800 family as the existing Flightradar24 b738 exterior. Keep the PNG and XML in model sources and point the existing glTF base-colour image at a uniquely named copy in `dist/models/`. Update the catalogue livery label to Ryanair. Retain the existing detailed 737 geometry rather than replacing it with a different or simplified plane.

Air France and Ryanair names identify the liveries. Samolociarze is not an official product of those airlines.
