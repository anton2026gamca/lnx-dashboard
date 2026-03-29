# LNX Dashboard - Robot Connection System

A comprehensive, production-ready robot connection system for controlling and monitoring robots via Socket.IO. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## 🌟 Features

### Connection Management
- ✅ Connect to robots by IP and port
- ✅ Save up to 20 robot configurations locally
- ✅ One-click quick connect to saved robots
- ✅ Real-time connection status with visual indicators
- ✅ Automatic connection validation and error handling

### Robot Interaction
- ✅ Real-time sensor monitoring (compass, IR, motors, line sensors)
- ✅ Live video streaming with detection overlays (configurable FPS)
- ✅ Manual robot control (movement and rotation)
- ✅ Robot mode management (idle, manual, autonomous)
- ✅ Comprehensive robot settings configuration

### User Experience
- ✅ Modern, intuitive UI with Tailwind CSS
- ✅ Full dark mode support
- ✅ Responsive design (desktop and mobile)
- ✅ Smooth animations and transitions
- ✅ Clear error messages and user feedback

### Developer Experience
- ✅ Full TypeScript support with zero `any` types
- ✅ Custom React hooks for common operations
- ✅ React Context for global state management
- ✅ Utility functions for robot operations
- ✅ Extensive inline code documentation

## 🚀 Quick Start

### Installation

```bash
cd /media/anton/Data/Projects/lnx-dashboard
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with RobotProvider
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── RobotConnectionScreen.tsx
│   ├── RobotConnectionForm.tsx
│   ├── SavedRobotsList.tsx
│   ├── RobotDashboard.tsx
│   └── RobotApp.tsx
├── context/               # React context
│   └── RobotContext.tsx   # Global robot state
├── hooks/                 # Custom hooks
│   └── useRobot.ts        # Robot interaction hooks
├── lib/                   # Libraries
│   ├── robotAPIClient.ts  # Socket.IO client
│   ├── robotStorage.ts    # localStorage wrapper
│   └── robotUtils.ts      # Utility functions
└── types/                 # TypeScript types
    └── robot.ts           # Robot interfaces
```

## 💻 Usage

### Basic Setup

```tsx
import { RobotProvider } from '@/context/RobotContext';
import { RobotConnectionScreen } from '@/components/RobotConnectionScreen';

export default function App() {
  return (
    <RobotProvider>
      <RobotConnectionScreen />
    </RobotProvider>
  );
}
```

### Connect to Robot

```tsx
import { useRobot } from '@/context/RobotContext';

function MyComponent() {
  const { createNewRobotConnection, connectToRobot } = useRobot();

  const handleConnect = async () => {
    const robot = createNewRobotConnection('MyRobot', '192.168.1.100', 8000);
    await connectToRobot(robot);
  };

  return <button onClick={handleConnect}>Connect</button>;
}
```

### Monitor Sensors

```tsx
import { useSensorData } from '@/hooks/useRobot';

function Sensors() {
  const { sensorData, loading, error } = useSensorData(500);
  
  return (
    <div>
      <p>Compass: {sensorData?.compass?.heading}°</p>
      <p>Distance: {sensorData?.ir?.distance}mm</p>
    </div>
  );
}
```

## 🔧 Technology Stack

- **Next.js** 16.2.1 - React framework
- **React** 19.2.4 - UI library
- **TypeScript** 5.x - Type safety
- **Tailwind CSS** 4.x - Styling
- **Socket.IO** 4.7.2 - Real-time communication
- **ESLint** 9.x - Code quality

## 📚 Key Hooks

- `useRobot()` - Main context hook for connection management
- `useSensorData()` - Fetch sensor data periodically
- `useRobotMode()` - Get and change robot mode
- `useVideoStream()` - Subscribe to video frames
- `useFrameDataUrl()` - Convert frame buffer to display URL
- `useManualControl()` - Send manual control commands

## 🎨 Components

- **RobotConnectionScreen** - Main connection interface
- **RobotConnectionForm** - Form to add new robots
- **SavedRobotsList** - Display saved robots
- **RobotDashboard** - Connected robot dashboard
- **RobotApp** - Main app switcher

## 📊 File Statistics

- **TypeScript/TSX Files**: 13
- **Total Lines of Code**: 1,615+
- **Documentation Files**: 5
- **Zero**: `any` types used!

## 🔌 API Integration

Integrates with the robot API at:
```
/media/anton/Data/Projects/lnx-infrabot/raspberrypi/robot/api/api.py
```

Supports all Socket.IO endpoints:
- Sensor data queries
- Video streaming
- Manual control
- Mode management
- Calibration procedures
- And more!

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern mobile browsers

## 🛠️ Adding New Features

1. Update types in `src/types/robot.ts`
2. Add API methods in `src/lib/robotAPIClient.ts`
3. Create hooks in `src/hooks/useRobot.ts` if commonly used
4. Build components in `src/components/`
5. Update existing documentation

## 📄 License

See LICENSE file.

