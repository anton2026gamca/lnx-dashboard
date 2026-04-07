'use client';

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="bg-main-200 dark:bg-main-800 hover:bg-main-300 dark:hover:bg-main-700 text-main-900 dark:text-main-200 px-2 py-0.5 flex items-center gap-1 border border-main-400 dark:border-main-700"
      aria-label="Toggle theme"
    >
      {theme === "dark" 
        ? <><Moon size={20} /><div className="flex-1 flex items-center justify-center">Dark</div></>
        : <><Sun size={20} /><div className="flex-1 flex items-center justify-center">Light</div></>
      }
    </button>
  );
}
