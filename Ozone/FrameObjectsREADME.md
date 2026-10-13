# Ozone frame objects

The former main-frame elements are available as independent EasyBuilder Pro
JavaScript objects. `Ozone/Main Frame.js` has been left in place as the legacy
combined version.

## Placement on a 1024 x 600 window

| Object | Position | Size | Configuration |
| --- | ---: | ---: | --- |
| `Header.js` | 0, 0 | 1024 x 48 | `HeaderConfig.json` |
| `Navigation.js` | 0, 48 | 182 x 514 | `NavigationConfig.json` |
| `ContentBackground.js` | 182, 48 | 842 x 514 | `ContentBackgroundConfig.json` |
| `SequenceControl.js` | 194, 452 | 812 x 100 | `SequenceControlConfig.json` |
| `Footer.js` | 0, 562 | 1024 x 38 | `FooterConfig.json` |

The main page content begins at x = 182, y = 48. Put `ContentBackground.js`
behind the Dashboard, other page-specific content, and the sequence panel.
Its background colour is `#1D252C`.

The content background has a 32 px title band. `activePageSub` changes the
displayed title using the active window number; `pageTitle` is the fallback.

## Navigation order and existing window numbers

1. Overview - window 10
2. Stack Fan - window 12
3. Ozone - window 11
4. Cooling Tower - window 13
5. Settings - window 14
6. Trends - window 15
7. Alarms - window 16

`navigationWrite` and `activePageSub` must point to the same addresses used by
the legacy main-frame object.

The sequence object keeps `sequenceRunningSub` exclusively for START/STOP
button logic. `sequenceStatusSub` controls only the displayed status word and
status colour.
