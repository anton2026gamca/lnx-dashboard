# Control Panel Components Guide

## Overview

The control panel has been refactored into modular, reusable components that can be used independently or together. All components use real-time Socket.IO subscriptions for state synchronization instead of polling intervals.

## Components Created

### 1. **ModeComponent** 
**File:** `src/components/control-panel/mode-component.tsx`

Displays and manages the robot mode (Idle, Autonomous, Manual) with real-time synchronization.

**Usage:**
```tsx
import { ModeComponent } from '@/components/control-panel';

export function Dashboard() {
  return <ModeComponent />;
}
```

**Features:**
- Real-time mode updates via Socket.IO subscription
- Three mode buttons: Idle, Autonomous, Manual
- Loading state handling
- Automatic sync with robot state

### 2. **TargetGoalComponent**
**File:** `src/components/control-panel/target-goal-component.tsx`

Allows selection of the target goal color (Yellow or Blue) with real-time sync.

**Usage:**
```tsx
import { TargetGoalComponent } from '@/components/control-panel';

export function Dashboard() {
  return <TargetGoalComponent />;
}
```

**Features:**
- Two goal color options: Yellow, Blue
- Real-time goal updates via Socket.IO
- Loading state handling
- Automatic refresh on change

### 3. **SettingsComponent**
**File:** `src/components/control-panel/settings-component.tsx`

Tabbed interface for Robot Settings with two tabs:
- **Motor Settings Tab** - Motor control options
- **Autonomous Settings Tab** - Autonomous mode configuration

**Usage:**
```tsx
import { SettingsComponent } from '@/components/control-panel';

export function Dashboard() {
  return <SettingsComponent />;
}
```

**Features:**
- Tab-based navigation between Motor and Autonomous settings
- Real-time setting updates
- Error handling and recovery

### 4. **MotorSettingsMenu**
**File:** `src/components/control-panel/motor-settings-menu.tsx`

Configuration menu for motor-related settings.

**Available Options:**
- Rotation Correction (ON/OFF toggle)
- Line Avoiding (ON/OFF toggle)
- Position Based Speed (ON/OFF toggle)
- Camera Ball Usage (ON/OFF toggle)

**Features:**
- Toggle-based controls
- Immediate API sync
- Error recovery with state revert

### 5. **AutonomousSettingsMenu**
**File:** `src/components/control-panel/autonomous-settings-menu.tsx`

Configuration menu for autonomous mode.

**Available Options:**
- State Machine Selection (dropdown)
- Always Facing Goal (ON/OFF toggle)

**Features:**
- Dynamic state machine loading
- Dropdown selector
- Toggle controls
- Automatic state fetching

### 6. **ManualMovementComponent**
**File:** `src/components/control-panel/manual-movement-component.tsx`

Displays keyboard control information and handles manual movement input.

**Keyboard Controls:**
- W/S - Forward/Backward
- A/D - Strafe Left/Right
- Arrow Left/Right - Rotate

**Features:**
- Active only in Manual mode
- Real-time keyboard input handling
- Visual feedback for active mode
- Instructions for inactive mode

### 7. **ControlPanel (Main Export)**
**File:** `src/components/control-panel/index.tsx`

Complete control panel combining all components.

**Usage:**
```tsx
import { ControlPanel } from '@/components/control-panel';

export function Dashboard() {
  return <ControlPanel />;
}
```

**Includes:**
- ModeComponent
- TargetGoalComponent
- SettingsComponent
- ManualMovementComponent

## Real-Time Synchronization

All components use Socket.IO subscriptions instead of polling:

### Updated Hooks

**useRobotMode()** - Uses `'mode_update'` event for real-time sync
- Initial fetch on connection
- Subscribes to mode updates
- Automatic cleanup on disconnect

**useTargetGoal()** - Uses `'goal_update'` event for real-time sync
- Initial fetch on connection
- Subscribes to goal updates
- Automatic cleanup on disconnect

### Benefits
- **Efficiency**: No polling overhead
- **Responsiveness**: Instant updates from robot
- **Scalability**: Can handle multiple clients
- **Consistency**: Single source of truth across the application

## Integration with Dashboard

The `RobotDashboard` component has been updated to use the new `ControlPanel`:

```tsx
import { ControlPanel } from '@/components/control-panel';

// In RobotDashboard:
<div className="flex-1 w-full bg-white dark:bg-main-950 outline-solid outline-2 dark:outline-main-900 overflow-hidden p-2">
  <div className="flex flex-col h-full gap-2 overflow-y-auto">
    <ControlPanel />
  </div>
</div>
```

## Component Structure

```
src/components/control-panel/
├── index.tsx                    # Main export
├── mode-component.tsx           # Mode selector
├── target-goal-component.tsx    # Goal color selector
├── settings-component.tsx       # Tab container
├── motor-settings-menu.tsx      # Motor options
├── autonomous-settings-menu.tsx # Autonomous options
└── manual-movement-component.tsx # Movement controls
```

## Styling

All components use:
- **Dark theme colors**: `bg-main-900`, `bg-main-950`, `text-white`
- **Status colors**: Blue for active, Yellow for yellow goal, Green for active manual mode
- **Tailwind CSS**: Consistent with existing codebase
- **Rounded corners**: `rounded` utility class

## State Management

Components manage state at three levels:

1. **Local State**: `localMode`, `localGoal` - Optimistic UI updates
2. **Hook State**: `mode`, `targetGoal` - Remote state from API client
3. **Socket Events**: Real-time updates from robot

State is kept in sync through:
- Effect hooks watching for changes
- Event listener subscriptions
- Automatic revert on errors

## Error Handling

All components include error handling:
- Try-catch blocks for API calls
- Error messages displayed to user
- Automatic state revert on failure
- Graceful fallbacks

## Future Enhancements

Potential improvements:
- Settings persistence to localStorage
- Undo/Redo functionality
- Settings presets/profiles
- Advanced motor tuning UI
- State machine visualization
- Keyboard shortcut customization
