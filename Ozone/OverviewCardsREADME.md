# Horizontal overview cards

These three independent JavaScript objects fill the Ozone content area when
the sequence-control panel is omitted from the Overview page.

| Object | Position | Size | Configuration |
| --- | ---: | ---: | --- |
| `OverviewStackFanCard.js` | 194, 88 | 818 x 92 | `OverviewStackFanCardConfig.json` |
| `OverviewCoolingTowerCard.js` | 194, 188 | 818 x 112 | `OverviewCoolingTowerCardConfig.json` |
| `OverviewOzoneGeneratorsCard.js` | 194, 308 | 818 x 244 | `OverviewOzoneGeneratorsCardConfig.json` |

Place all three above `ContentBackground.js`. Their positions leave room for
the background object's 32 px current-page title band.

The Ozone Generators card keeps all five units in one object so they can be
compared side-by-side. Each unit has independent status, fault, output-percent,
output-current, and output-flow subscriptions. Output, current, and flow units
and decimal places are configurable.

The existing `Dashboard.js` remains available as the legacy combined overview.
