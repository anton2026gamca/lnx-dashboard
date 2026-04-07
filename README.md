# LNX Dashboard

A dashboard for managing [robocup soccer robots](https://github.com/anton2026gamca/lnx-infrabot/) through their API. This tool allows to monitor robot status, send commands, view logs, configure robot settings and calibrate robot sensors, providing an intuitive interface for efficient robot management and real-time interaction.

#### Supported robots:
- [LNX Infrabot](https://github.com/anton2026gamca/lnx-infrabot/)

## Features

### Connection Management
- Connect to robots by IP and port
- Save up to 20 robot configurations locally
- Automatic connection validation and error handling

### Robot Interaction
- Real-time sensor monitoring (compass, IR, motors, line sensors)
- Live video streaming with detection overlays (configurable FPS)
- Manual robot control (movement and rotation)
- Robot mode management (idle, manual, autonomous)

### User Experience
- Modern, intuitive UI with Tailwind CSS
- Full light mode support (and dark mode of course...)
- Clear error messages and user feedback

### Developer Experience
- Full TypeScript support with zero `any` types
- Custom React hooks for common operations
- React Context for global state management
- Utility functions for robot operations

## Quick Start

### Installation

```bash
cd /media/anton/Data/Projects/lnx-dashboard
npm install
```

### Development

#### Browser

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Tauri

```bash
npx tauri dev
```

### Production Build

```bash
npx tauri build
```

## Technology Stack

- **Next.js** 16.2.1
- **React** 19.2.4
- **TypeScript** 5.x
- **Tailwind CSS** 4.x
- **Socket.IO** 4.7.2
- **ESLint** 9.x

## API Integration

Integrates with the [lnx-infrabot api](https://github.com/anton2026gamca/lnx-infrabot/blob/main/raspberrypi/robot/api/API_DOCUMENTATION.md)

## License

See [LICENSE](/LICENSE)

