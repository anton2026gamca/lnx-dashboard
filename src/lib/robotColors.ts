/**
 * Robot color utilities for UI distinction
 */

export type RobotColorName = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'cyan' | 'orange';

export const ROBOT_COLORS: Record<RobotColorName, {
  light: string;
  dark: string;
  border: string;
  darkBorder: string;
  bg: string;
  darkBg: string;
}> = {
  red: {
    light: 'text-red-700',
    dark: 'dark:text-red-400',
    border: 'border-red-300',
    darkBorder: 'dark:border-red-700',
    bg: 'bg-red-50',
    darkBg: 'dark:bg-red-900/20',
  },
  blue: {
    light: 'text-blue-700',
    dark: 'dark:text-blue-400',
    border: 'border-blue-300',
    darkBorder: 'dark:border-blue-700',
    bg: 'bg-blue-50',
    darkBg: 'dark:bg-blue-900/20',
  },
  green: {
    light: 'text-green-700',
    dark: 'dark:text-green-400',
    border: 'border-green-300',
    darkBorder: 'dark:border-green-700',
    bg: 'bg-green-50',
    darkBg: 'dark:bg-green-900/20',
  },
  yellow: {
    light: 'text-yellow-700',
    dark: 'dark:text-yellow-400',
    border: 'border-yellow-300',
    darkBorder: 'dark:border-yellow-700',
    bg: 'bg-yellow-50',
    darkBg: 'dark:bg-yellow-900/20',
  },
  purple: {
    light: 'text-purple-700',
    dark: 'dark:text-purple-400',
    border: 'border-purple-300',
    darkBorder: 'dark:border-purple-700',
    bg: 'bg-purple-50',
    darkBg: 'dark:bg-purple-900/20',
  },
  pink: {
    light: 'text-pink-700',
    dark: 'dark:text-pink-400',
    border: 'border-pink-300',
    darkBorder: 'dark:border-pink-700',
    bg: 'bg-pink-50',
    darkBg: 'dark:bg-pink-900/20',
  },
  cyan: {
    light: 'text-cyan-700',
    dark: 'dark:text-cyan-400',
    border: 'border-cyan-300',
    darkBorder: 'dark:border-cyan-700',
    bg: 'bg-cyan-50',
    darkBg: 'dark:bg-cyan-900/20',
  },
  orange: {
    light: 'text-orange-700',
    dark: 'dark:text-orange-400',
    border: 'border-orange-300',
    darkBorder: 'dark:border-orange-700',
    bg: 'bg-orange-50',
    darkBg: 'dark:bg-orange-900/20',
  },
};

const COLOR_NAMES: RobotColorName[] = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'cyan', 'orange'];

/**
 * Assign a unique color based on robot ID
 * Returns type compatible with RobotColor from @/types/robot
 */
export function getColorForRobot(robotId: string): string {
  const hash = robotId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const index = Math.abs(hash) % COLOR_NAMES.length;
  return COLOR_NAMES[index];
}

/**
 * Get all color class names for a robot color
 */
export function getColorClasses(color: RobotColorName): string {
  const colorStyle = ROBOT_COLORS[color];
  return `${colorStyle.light} ${colorStyle.dark} ${colorStyle.border} ${colorStyle.darkBorder} ${colorStyle.bg} ${colorStyle.darkBg}`;
}

/**
 * Get dot color for a robot (for visual indicator)
 */
export function getColorDotClass(color: RobotColorName): string {
  const dotColors: Record<RobotColorName, string> = {
    red: 'bg-red-600 dark:bg-red-400',
    blue: 'bg-blue-600 dark:bg-blue-400',
    green: 'bg-green-600 dark:bg-green-400',
    yellow: 'bg-yellow-600 dark:bg-yellow-400',
    purple: 'bg-purple-600 dark:bg-purple-400',
    pink: 'bg-pink-600 dark:bg-pink-400',
    cyan: 'bg-cyan-600 dark:bg-cyan-400',
    orange: 'bg-orange-600 dark:bg-orange-400',
  };
  return dotColors[color];
}
