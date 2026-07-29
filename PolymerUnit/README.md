# Polymer Unit HMI frame

Light-theme frame objects for a 1024 × 600 Weintek EasyBuilder Pro
screen.

| JS object | Position | Size |
|---|---:|---:|
| `Header.js` | x 0, y 0 | 1024 × 35 |
| `Navigation.js` | x 0, y 35 | 150 × 530 |
| `NavigationNoMakeupDosing.js` | x 0, y 35 | 150 × 530 |
| `Footer.js` | x 0, y 565 | 1024 × 35 |
| `ContentBackground.js` | x 150, y 35 | 874 × 530 |
| `OverviewContentBackground.js` | x 150, y 35 | 865 × 370 |
| `SetpointsContentBackground.js` | x 150, y 35 | 865 × 370 |
| `SettingsContentBackground.js` | x 150, y 35 | 865 × 370 |
| `StatusInstrumentPanel.js` | user positioned | 437 × 150 |

Place `ContentBackground.js` behind all objects on each content page.
Its light-grey fill matches the navigation, footer, and polymer process
objects so their edges blend into the frame.

Page-specific copies are provided for the Overview, Setpoints, and
Settings windows. Each uses the same position, size, and colour and
should remain behind all other objects on its page. Each page-specific
background includes a subtle outline, an upper-left page title, and a
light teal header fade into the standard content background colour.

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

`NavigationNoMakeupDosing.js` is a separate version with the Make-Up
and Dosing tabs removed. It retains the original window numbers:
10 Overview and 13-16 Setpoints through Settings. Import
`NavigationNoMakeupDosingConfig.json` for its configuration.

### Footer

- `footerText`: defaults to `POLYMER PROCESS CONTROL`
- `operatorName`: defaults to `OPERATOR`
- `revision`: defaults to `REV 1.0`

## VSD faceplate

`VSD_Faceplate.js` is a 560 × 360 control faceplate showing Auto/Manual
mode, command direction, VSD status, header fault status, current,
speed feedback, voltage, power, manual speed, and the last fault code.
Auto and Manual write `0` and `1` respectively to one maintained
`modeWrite` tag. Start Forward, Stop, and Reset issue configurable
300 ms command pulses. In Manual mode, Start Forward is enabled only
when `vsdStatusSub` is Stopped (`1`), Stop is enabled when the status
is not Stopped, and Reset is enabled when `readyResetSub` is on.

Import `VSD_FaceplateConfig.json` through the JS Object **Config >
Template** editor. Its subscription and write fields use the Local HMI
placeholder address; assign each one to its corresponding PLC tag from
the Config tab.

The faceplate deliberately leaves two wide areas on the left for native
EasyBuilder objects:

- Add the last-fault display at x 26, y 156, size 230 × 32 relative to
  the faceplate. The JS faceplate does not subscribe to this value.
- Add a Numeric Input at x 72, y 232, size 138 × 36. Enable its popup
  keypad and interlock it so input is allowed only when the mode tag
  equals `1`. Configure it to the same tag used by `manualSpeedSub` and
  `manualSpeedWrite`. The JS area remains blank for this native object;
  the adjacent −/+ buttons adjust the value in `manualSpeedStep`
  increments, defaulting to 0.5 Hz.

## Digital output faceplate

`DigitalOutputFaceplate.js` is a 480 × 230 light-theme control
faceplate. It shows Auto/Manual mode, device status, and fault status,
with On, Off, and Reset controls. The equipment title and tag are left
blank for native EasyBuilder text objects.

Import `DigitalOutputFaceplateConfig.json` through the JS Object
**Config > Template** editor. Auto and Manual write `0` and `1` to the
maintained `modeWrite` tag. On and Off use separate momentary
`onCmdWrite` and `offCmdWrite` tags. In Manual mode, On is enabled when
the device status is Off (`0`), Off is enabled when the status is not
Off, and Reset is enabled by `readyResetSub`. On, Off, and Reset use
configurable 300 ms pulses.

## Flocculant tank

`FlocculantTank.js` is a transparent 230 × 260 display object for the polymer
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
500 ms. The tank title is centred and the level-condition/fault badge
is displayed below the vessel. A missing fault subscription or
communication error forces code `32`. A transient
`levelSub` error retains the last valid level reading. After
`levelFaultSub` has supplied its first valid response, a transient
fault-subscription error also retains the last valid fault code.
Startup remains fail-safe if no valid fault response is received.

## Flocculant dosing process

### Polymer batch tank

`PolymerTank.js` is a transparent 190 × 280 tank object using two
discrete level switches and a top-mounted DOL mixer. Import
`PolymerTankConfig.json` and configure:

- `lowLevelSub`: low switch wet/active status.
- `highLevelSub`: high switch wet/active status used to start batching.
- `mixerStatusSub`: `0` off, `1` on, `2` pulse off, `3` pulse on,
  `4` pulse continuous, `5` turning on, `6` turning off.
- `mixerFaultSub`: `0` none, `16` on/off fail, `32` I/O fault,
  `34` configuration error.

The high switch is shown around 65% of vessel height so the batch-start
level retains headspace. The graphic infers low, filling, and
batch-ready fill bands from the two switches. A high-active/low-dry
combination is displayed as a switch conflict.

The DOL mixer has no speed value. Its shaft and impeller animate for
running states, transition states flash, and its fault message is only
shown while a nonzero mixer fault code is active.

### Flocculant VSD pump

`FlocculantPump.js` is a standalone transparent 180 × 220 equipment object with no
pipeline. Import `FlocculantPumpConfig.json` and configure:

- `pumpStatusSub`: `1` stopped, `2` running forward, `3` running
  reverse, `5` starting forward, `6` starting reverse, `10` stopping.
- `pumpModeSub`: `0` automatic, nonzero manual.
- `pumpOutputSub`: VSD output value.
- `pumpFaultSub`: `0` healthy, `16` fail to start, `17` fail to stop,
  `18` drive fault, `32` I/O fault.

The title and operating state are centred above the pump. The equipment
tag is displayed below the pump. Fault status appears below the tag
only while a real fault is active.

### Potable water valve

`PotableWaterValve.js` is a standalone transparent 180 × 175 actuated-valve object
with no pipeline. Import `PotableWaterValveConfig.json` and configure:

- `valveStatusSub`: `0` off, `1` on, `2` pulse off, `3` pulse on,
  `4` pulse continuous, `5` turning on, `6` turning off.
- `valveFaultSub`: `0` healthy, nonzero fault.

The position state is shown below the title. The equipment tag is
between the valve symbol and the fault area. The fault indicator is
hidden while healthy. `ON` is green; `TURNING ON` and `TURNING OFF`
flash blue.

### Static mixer

`StaticMixer.js` is a standalone 180 × 120 mixer symbol with no
pipeline or PLC values. Import `StaticMixerConfig.json` to set its
display name and equipment tag.

### Flow meter

`FlowMeter.js` is a standalone, transparent 130 × 105 flow-transmitter
object. Import `FlowMeterConfig.json` and configure:

- `waterFlowSub`: numeric flow engineering value, normally a 32-bit
  float.
- `waterFlowFaultSub`: Boolean fault value; `0` is healthy and nonzero
  is faulted.
- `flowUnit` and `flowDecimals`: numeric display formatting.
- `meterName` and `instrumentTag`: display name and equipment tag.

The subscription names match the Ozone cooling-tower flow meter. A
fault or unavailable fault subscription shows a flashing red `FAULT`;
a transient value-subscription error retains the last valid reading.

The pump, valve, mixer, and flow meter are intentionally independent
so separate pipeline JS objects can be added and positioned later.

The flocculant-pump VSD speed panel is centred above the pump with
clearance from the casing. Its separate `MAN` badge is shown only in
Manual mode. The potable-water valve uses the same Manual-only badge,
driven by `valveModeSub` (`0` Auto, nonzero Manual). Boolean
`pumpInterlockSub` and `valveInterlockSub` indications have higher
priority: an active interlock replaces the mode badge with a red
`INTLK` badge.

The Polymer Tank mixer follows the same priority through
`mixerModeSub` and `mixerInterlockSub`: red `INTLK` overrides yellow
`MAN`, and normal Auto mode shows no badge.

After updating these sources in EasyBuilder Pro, resize the placed JS
objects to their documented design sizes. The pump, valve, tank, and
flow-meter canvases are transparent and tightly cropped so adjacent
objects can overlap geometrically without hiding one another.

## Sequence control panel

`SequenceControlPanel.js` is a 437 × 150 object. Two panels placed at
x 150 and x 587 span the 874 px content area. Import
`SequenceControlPanelConfig.json` separately for each panel and assign
each copy to its own sequence tags.

The configuration matches the Ozone main-frame sequence interface:

- `startCmdWrite`, `stopCmdWrite`, `resetCmdWrite`: writable Boolean
  addresses.
- `sequenceRunningSub`: controls START/STOP button availability.
- `sequenceStatusSub`: sequence status word used for display only.
- `readyResetSub`: enables the RESET button.
- `startCmdSub`, `stopCmdSub`, `resetCmdSub`: command readbacks.
- `stepNumberSub`: current integer sequence step.
- `stepTimeSub`: elapsed PLC `TIME` value supplied in milliseconds.
- `stepTimeDivisor`: conversion divisor; defaults to `1000` to display
  the PLC `TIME` value as seconds.
- `stepMessageSub`: current PLC step-message string.

START clears STOP to `0`, then writes START to `1`. STOP clears START
to `0`, then writes STOP to `1`. These are maintained commands. RESET
writes `1` and returns to `0` after 300 ms.

The Ozone status-word mapping is retained:

- `1` active, `2` idle, `3` standby, `4` running
- `5` hold, `6` device in manual, `7` minor fault
- `8` powerup hold, `9` powerup, `10` latch fault

## Plain status and instrument panel

`StatusInstrumentPanel.js` is a blank 437 × 150 light-theme panel with
the same footprint, corner radius, and border as the Sequence Control
Panel. It has no configuration or subscriptions. Place native
EasyBuilder labels, status indicators, numeric displays, and instrument
readings over it.

`InstrumentReadingWidget.js` is a 200 × 30 horizontal widget configured
with `instrumentName`, `readingSub`, `readingDecimals`, and
`readingUnit`.

`BooleanStatusWidget.js` is a 200 × 30 widget configured with
`statusName`, `statusSub`, `onText`, and `offText`. ON uses green and
OFF uses neutral grey; unavailable data displays `---`.

`VSDStatusSpeedWidget.js` is a 200 × 30 horizontal widget configured
with `vsdName`, Boolean `runningSub`, numeric `speedSub`,
`speedDecimals`, and `speedUnit`. Its dot is green while running and
neutral grey while off.

`NumericSetpointWidget.js` is a 360 × 44 control with configurable
name, unit, limits, increment, setpoint subscription, and write
address. Its −/+ buttons adjust the current value. Place an EasyBuilder
Numeric Input at x 213, y 7, size 60 × 30 relative to the widget and
configure it to the same setpoint tag for built-in keypad entry.
`privilegeSub` must be true to enable the −/+ controls. Configure the
native Numeric Input with the same privilege tag as its interlock so
keypad entry follows the same permission.

`NumericSetpointInputWidget.js` is a simplified 360 × 44 version
without increment or decrement controls. Place a native EasyBuilder
Numeric Input at x 213, y 7, size 60 × 30. Configure the PLC address,
limits, numeric format, and popup keypad directly on that native
object.

`BooleanSetpointWidget.js` is a 220 × 44 maintained Boolean control.
Its configurable `offText` and `onText` buttons write `0` and `1` to
`setpointWrite`, while `setpointSub` controls the active indication.
Its OFF/ON controls are enabled only when `privilegeSub` is true.
