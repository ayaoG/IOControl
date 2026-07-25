# Polymer Unit HMI frame

Light-theme frame objects for a 1024 × 600 Weintek EasyBuilder Pro
screen.

| JS object | Position | Size |
|---|---:|---:|
| `Header.js` | x 0, y 0 | 1024 × 35 |
| `Navigation.js` | x 0, y 35 | 150 × 530 |
| `Footer.js` | x 0, y 565 | 1024 × 35 |
| `ContentBackground.js` | x 150, y 35 | 874 × 530 |

Place `ContentBackground.js` behind all objects on each content page.
Its light-grey fill matches the navigation, footer, and polymer process
objects so their edges blend into the frame.

## Object configuration

### Header

- `projectTitle`: defaults to `POLYMER UNIT`
- `siteName`: defaults to `PROCESS CONTROL`

### Navigation

- `navigationWrite`: address used to request a base-window change
- `activePageSub`: subscription returning the active base-window number

Paste the contents of `NavigationConfig.json` into the EasyBuilder Pro
JS Object **Config > Template** editor. Both entries initially use the
Local HMI placeholder address from the Ozone project. After importing,
edit them in the Config tab:

1. Set `navigationWrite` to the 16-bit address that receives the
   requested window number.
2. Set `activePageSub` to a 16-bit subscription containing the current
   base-window number.

The address that receives the request must be connected to the
EasyBuilder base-window change logic. Writing a number to an ordinary
LW register by itself does not change the displayed window.

Default page mapping:

- 10 Overview
- 11 Make-up
- 12 Dosing
- 13 Setpoints
- 14 Trends
- 15 Alarms
- 16 Settings

Edit the `navigationItems` array in `Navigation.js` if the EasyBuilder
project uses different base-window numbers or labels.

### Footer

- `footerText`: defaults to `POLYMER PROCESS CONTROL`
- `operatorName`: defaults to `OPERATOR`
- `revision`: defaults to `REV 1.0`

## Flocculant tank

`FlocculantTank.js` is a 300 × 300 display object for the polymer
make-up page. Import `FlocculantTankConfig.json` through the JS Object
**Config > Template** editor, then configure:

- `levelSub`: PLC level-transmitter engineering value. Select the PLC
  data type that matches the tag, typically 32-bit float.
- `levelFaultSub`: PLC transmitter numeric fault code. Configure this
  with the same integer data type as the PLC tag.
- `levelMinimum` and `levelMaximum`: scaling limits used by the tank
  graphic.
- `levelUnit` and `levelDecimals`: numeric display formatting.

The configuration follows the Ozone pressure pattern of separate value
and fault subscriptions. The matching Ozone fault-code mapping is:

- `0`: healthy
- `20`: low
- `21`: high
- `24`: low-low
- `25`: high-high
- `32`: signal fault

LOW and HIGH retain the level reading and use yellow. LOW-LOW and
HIGH-HIGH retain the reading and use orange. Signal faults and unknown
nonzero codes use red and replace the reading with `---`. LOW/HIGH
pulse every second; LOW-LOW/HIGH-HIGH and signal faults flash every
500 ms. A missing fault subscription or communication error forces
code `32`. A transient `levelSub` error retains the last valid level
reading. After `levelFaultSub` has supplied its first valid response,
a transient fault-subscription error also retains the last valid fault
code. Startup remains fail-safe if no valid fault response is received.
