# Robot Dashboard Component

## Overview

The `RobotDashboard` is a comprehensive real-time sensor visualization and control interface for the LNX robot. It displays camera feed, sensor data, motor states, and robot position in a clean, compact layout with minimal margins and paddings.

## Architecture

### Sub-Components

The dashboard is built from modular, reusable sub-components:

#### **SensorCard**
- **Purpose**: Display a labeled sensor value with optional custom content
- **Props**:
  - `label` (string): Sensor name (e.g., "Heading", "Distance")
  - `value` (string | number): The sensor reading
  - `color` (string): Text color class (default: `text-green-500`)
  - `children` (React.ReactNode): Optional additional content

#### **Compass**
- **Purpose**: Visualize heading direction with N/E/S/W indicators
- **Props**:
  - `heading` (number): Heading angle in degrees (0-360)
- **Features**: Animated needle, cardinal directions

#### **LineSensorGrid**
- **Purpose**: Display 12 line sensors in a 12-column grid
- **Props**:
  - `sensors` (number[]): Normalized sensor values (0-1)
  - `detected` (boolean[]): Detection state per sensor
- **Features**: Color-coded intensity, yellow border on detection

#### **MotorVisualizer**
- **Purpose**: Calculate and display robot movement direction from motor speeds
- **Props**:
  - `speeds` (number[]): 4 motor speeds at 135°, 225°, 315°, 45° locations
- **Features**: Decomposes motor speeds into movement vector and rotation

#### **BallDirectionIndicator**
- **Purpose**: Show detected ball angle and distance visualization
- **Props**:
  - `angle` (number): Ball angle in degrees
  - `detected` (boolean): Whether ball is currently detected
- **Features**: Color changes based on detection state

## Layout Structure

```
┌─ Header (Robot Name, IP, Status, Disconnect Button)
├─ Video Controls & Stream
│  ├─ Video ON/OFF button
│  ├─ FPS selector (5, 15, 30, 60)
│  └─ Camera feed (aspect-video)
└─ Main Grid (3-column layout on lg+, 1-column on mobile)
   ├─ Left Column (col-span-2)
   │  ├─ Compass & Detection (Heading, Pitch, Roll, Compass)
   │  ├─ Line Sensors (12-grid)
   │  └─ Motors & Ball Detection (2-column sub-grid)
   └─ Right Column
      ├─ Status (Status, Mode)
      ├─ Goal Detection (if available)
      ├─ Position Estimate (if available)
      └─ Loading state
```

## Styling

- **Spacing**: All padding/margin uses Tailwind's `p-2` and `gap-2` (minimal)
- **Colors**: 
  - Dark mode: `dark:bg-zinc-800`, `dark:text-white`
  - Light mode: `bg-white`, `text-zinc-900`
  - Accent: `text-green-500`, `text-yellow-400`, `text-blue-600`
- **Typography**: Small sizes (`text-xs`, `text-sm`) for compact display
- **Shadows**: `shadow-sm` for subtle depth

## Data Flow

The dashboard receives sensor data from:

1. **useSensorData()** hook - Real-time sensor readings
2. **useRobotMode()** hook - Current robot mode (idle, autonomous, manual)
3. **useVideoStream()** hook - Camera frame data
4. **useRobot()** context - Connection state and control functions

## Extending the Dashboard

### Adding a New Sensor Panel

1. **Create a sub-component** (if needed):
```typescript
const MySensorDisplay: React.FC<{ data: MyData }> = ({ data }) => (
  <div className="bg-white dark:bg-zinc-800 rounded p-2 shadow-sm">
    <h3 className="text-xs font-bold uppercase mb-2">My Sensor</h3>
    {/* Content */}
  </div>
);
```

2. **Add to appropriate section**:
   - Left column for large visualizations
   - Right column for status/summary information
   - Use consistent spacing: `gap-2`, `p-2`

3. **Use existing sub-components** for consistency:
   - `SensorCard` for simple value displays
   - `LineSensorGrid` for grid-based sensors
   - Create custom visualizers for complex data

### Example: Adding a Temperature Sensor
```typescript
{formattedSensors?.temperature && (
  <div className="bg-white dark:bg-zinc-800 rounded p-2 shadow-sm">
    <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase mb-2">
      Temperature
    </h3>
    <SensorCard 
      label="Battery Temp" 
      value={`${formattedSensors.temperature.battery}°C`}
      color={formattedSensors.temperature.battery > 50 ? 'text-red-500' : 'text-green-500'}
    />
  </div>
)}
```

## Best Practices

1. **Use minimal spacing**: Prefer `p-2`, `gap-2`, `mb-2` over larger values
2. **Keep components focused**: Each sub-component should handle one visualization
3. **Type safety**: Always include TypeScript interfaces for props
4. **Dark mode**: Use `dark:` prefix for colors in all components
5. **Responsive**: Test mobile layout (1-column) and desktop (3-column)
6. **Performance**: Memoize sub-components if they receive complex props
7. **Accessibility**: Include descriptive labels and use semantic HTML

## Features Supported

- ✅ Real-time video stream with FPS control
- ✅ Compass heading (BNO055)
- ✅ Line sensors (12 units) with detection highlighting
- ✅ IR ball detection (angle & distance)
- ✅ Motor speeds visualization
- ✅ Motor movement direction calculation
- ✅ Goal detection status
- ✅ Robot position estimate (X, Y)
- ✅ Connection status and mode display
- ✅ Responsive grid layout
- ✅ Dark mode support

## Future Enhancements

- [ ] Calibration modals for sensors
- [ ] Autonomous state pipeline visualization
- [ ] Manual control joystick interface
- [ ] Logs/debug panel
- [ ] Settings panel for motor parameters
- [ ] Ball and goal color calibration interfaces
- [ ] Field visualization with robot position
- [ ] Kicker state indicator
