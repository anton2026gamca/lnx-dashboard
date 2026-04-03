# Calibration System Implementation

A comprehensive calibration system for the LNX robot dashboard, providing six major calibration subsystems with a clean, modular architecture.

## Overview

The calibration system includes:

1. **Line Sensor Calibration** - 12-sensor threshold calibration with two-phase approach
2. **Goal Color Calibration** - Interactive and manual HSV range calibration for yellow/blue goals
3. **Ball Color Calibration** - Orange ball HSV range calibration with region drawing
4. **Camera Ball Distance Calibration** - Single-point distance constant calibration
5. **Goal Distance Calibration** - Camera focal length calibration for distance estimation
6. **Reset Compass** - Compass heading recalibration

## Architecture

### Component Structure

```
src/components/calibration/
├── CalibrationMenu.tsx              # Main menu for subsystem selection
├── Modal.tsx                        # Reusable modal component
├── HSVPicker.tsx                    # HSV range picker with 3 canvas maps
├── CameraRegionDrawer.tsx           # Interactive region drawing on video
├── index.ts                         # Component exports
└── subsystems/
    ├── LineCalibrationModal.tsx
    ├── GoalColorCalibrationModal.tsx
    ├── BallColorCalibrationModal.tsx
    ├── CameraBallDistanceCalibrationModal.tsx
    ├── GoalDistanceCalibrationModal.tsx
    └── ResetCompassModal.tsx
```

### Hook Structure

```
src/hooks/
└── useCalibration.ts
    ├── useLineCalibration()          # Phase 1/2, status updates
    └── useGoalDistanceCalibration()  # Active state, phase tracking
```

### Type Structure

```
src/types/
└── calibration.ts
    ├── HSVRange                     # H/S/V min/max values
    ├── ColorCalibration             # Lower/upper bounds
    ├── LineCalibrationStatus        # Phase & threshold data
    ├── GoalDistanceCalibrationStatus
    └── DrawRegion                   # Region + HSV values
```

## Key Features

### Line Sensor Calibration

- **Phase 1**: Field calibration - drive robot around field to establish baseline
- **Phase 2**: Line verification - optional refinement by driving across lines
- **Manual Adjustment**: 12-row table editor with phase 1/2 reference values and delta calculations
- **Live Updates**: Real-time min/max display during calibration
- **Direct Access**: Skip phases and go straight to manual adjustment

### Color Calibration (Goals & Ball)

**Dual-Method Approach** (both methods work independently, synced in real-time):

1. **Interactive Method**: Camera region drawing
   - Live video stream with canvas overlay
   - Click-drag rectangle drawing on actual field/ball images
   - Auto-compute HSV from drawn regions
   - Merge multiple regions with min/max aggregation
   - Visual feedback of drawn regions

2. **Manual Method**: HSV Range Picker
   - Three interactive 2D maps: Hue-Saturation, Hue-Value, Saturation-Value
   - Live visualization with green selection rectangles
   - Dual sliders per channel (min/max)
   - Numeric inputs for precise values
   - Synchronized visualization across all three maps

**Method Toggle**: Set `USE_INTERACTIVE_METHOD` and `USE_MANUAL_METHOD` to `true/false` to enable/disable either method

### Camera Ball Distance Calibration

- Simple single-distance calibration
- Live video feed with ball detection
- Input: known distance in millimeters
- Output: calibration constant stored on robot
- Success/error feedback

### Goal Distance Calibration

- Two-step distance input (initial position and line position)
- Live video feed with detection overlay
- Real-time phase status updates
- Built-in mode control (manual robot movement)
- Dynamic instructions based on calibration state
- Status display of pixel heights at different stages

### Reset Compass

- Simple one-click operation
- Positions robot reference heading to current orientation
- Success confirmation with auto-close

## Usage

### Basic Setup

The calibration system is integrated into the Control Panel:

```tsx
import { ControlPanel } from '@/components/robot/dashboard/control-panel';

export default function Dashboard() {
  return <ControlPanel />;
}
```

### Manual Modal Usage

```tsx
import { CalibrationMenu } from '@/components/calibration';

export const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Calibration</button>
      <CalibrationMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
```

### Subsystem-Specific Usage

```tsx
import { LineCalibrationModal } from '@/components/calibration/subsystems/LineCalibrationModal';

export const CalibrationForm = () => {
  return <LineCalibrationModal onClose={() => {}} />;
};
```

## API Integration

The system communicates with the robot backend via Socket.IO through these methods:

### Line Calibration
- `startLineCalibration(phase)` - Start phase 1 or 2
- `stopLineCalibration()` - Stop and get thresholds
- `cancelLineCalibration()` - Abort without saving
- `getLineCalibrationStatus()` - Query current state
- `setLineThresholds(thresholds)` - Apply manual edits

### Color Calibration
- `getGoalSettings()` - Load current calibration
- `setGoalSettings(calibration)` - Save goal colors
- `setBallCalibration(lower, upper)` - Save ball color
- `getBallColorCalibration()` - Load ball color
- `computeHsvFromRegions(regions)` - Analyze drawn regions

### Distance Calibration
- `calibrateBallDistance(distance_mm)` - Single point calibration
- `startGoalDistanceCalibration(init, line)` - Begin two-point process
- `stopGoalDistanceCalibration()` - Complete calibration
- `cancelGoalDistanceCalibration()` - Abort

### Other
- `resetCompass()` - Reset compass heading

## Styling

All components follow the existing design system:

- **No border-radius** - sharp edges throughout
- **Minimal padding/gaps** - compact layout
- **Color scheme**: `main-*` Tailwind colors with dark mode support
- **Button pattern**: Uses existing `Button` component
- **Modal design**: `bg-[color]/20` for semi-transparent overlays

## Data Flow

### Line Calibration Phase Flow

```
Menu → Start Phase 1 → Live Updates → Stop → [Can Continue?]
  ↓                                          ↓
  └──→ Manual Adjustment ←──────────────────┘
          ↓
        Apply & Close
```

### Color Calibration Data Flow

```
Interactive Method              Manual Method
     ↓                               ↓
  Draw Region    ←→ HSV Picker ←→  Sync Values
  Compute HSV                        ↓
     ↓                          Apply & Close
  Merge Min/Max ←────────────→
     ↓
   Apply & Close
```

## State Management

- **Component-Level**: useState for UI state (visibility, form inputs)
- **Context**: useRobot() for connection state
- **Hooks**: useLineCalibration(), useGoalDistanceCalibration() for async operations
- **Real-Time**: Socket.IO event subscriptions for live updates

## Error Handling

All modals include:
- Try-catch error boundaries
- User-friendly error messages
- Loading states for async operations
- Validation before submission
- Graceful failure recovery

## Customization

### Disable a Color Method

In `GoalColorCalibrationModal.tsx` or `BallColorCalibrationModal.tsx`:

```tsx
const USE_INTERACTIVE_METHOD = false; // Disable region drawing
const USE_MANUAL_METHOD = true;       // Keep manual HSV picker
```

The UI will automatically hide disabled sections.

### Adjust HSV Picker Canvas Size

In `HSVPicker.tsx`:

```tsx
<canvas
  ref={canvasRefs.hs}
  width={200}  // Change from 150
  height={200}
  className="..."
/>
```

### Customize Modal Appearance

In `Modal.tsx`:

```tsx
// Adjust size classes
const sizeClasses = {
  small: 'max-w-sm',    // Modify
  medium: 'max-w-3xl',
  large: 'max-w-5xl',
};
```

## Performance Considerations

- **Video Streaming**: Configurable FPS per subsystem (5-60)
- **Canvas Rendering**: Only updates when state changes
- **Event Subscriptions**: Properly cleaned up in useEffect dependencies
- **Memory**: Region arrays properly managed, old URLs revoked

## Accessibility

- Keyboard-friendly modal controls
- Clear, descriptive labels
- Logical tab order
- Color contrast meets WCAG standards
- Alternative text for visual elements

## Testing

To test the system:

1. Open calibration menu: Click "Open Calibration Menu" in control panel
2. Select a subsystem
3. Follow on-screen instructions
4. Verify:
   - Live updates display correctly
   - Values are applied to robot
   - Modal closes after completion
   - Settings persist across sessions

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern mobile browsers

## Future Enhancements

- [ ] Calibration profiles (save/load multiple configurations)
- [ ] Automatic camera detection for region drawing
- [ ] Calibration history and rollback
- [ ] Batch calibration (all at once)
- [ ] Calibration validation (verify results)
- [ ] Export/import calibration data
- [ ] Per-color preview during goal calibration
