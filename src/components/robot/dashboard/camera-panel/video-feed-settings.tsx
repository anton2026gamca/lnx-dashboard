import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";




interface VideoFeedSettingsProps {
  fps?: number;
  videoEnabled?: boolean;
  setFps?: (fps: number) => void;
  setVideoEnabled?: (enabled: boolean) => void;
  refresh?: () => void;
  forceEnabled?: boolean;
  forceFPS?: number;
}

export const VideoFeedSettings: React.FC<VideoFeedSettingsProps> = ({fps, videoEnabled, setFps, setVideoEnabled, refresh, forceEnabled = false, forceFPS = undefined}) => {
  return (forceEnabled !== true || !forceFPS) && (
    <div className="p-1 flex gap-5 items-center">
      {forceEnabled !== true && (
        <Button
          onClick={() => setVideoEnabled && setVideoEnabled(!videoEnabled)}
          activeClass={videoEnabled
            ? 'bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-400 dark:hover:bg-lime-500 dark:text-black'
            : 'bg-main-300 hover:bg-main-400 text-main-900 dark:bg-main-900 dark:hover:bg-main-800 dark:text-white'}
          active={true}
          className="px-1 text-sm font-medium flex-1 max-h-4"
        >{`Video: ${videoEnabled ? 'ON' : 'OFF'}`}</Button>
      )}

      {!forceFPS && (
        <div className="flex-4 flex gap-1 items-center">
          <span className="text-sm text-main-500 dark:text-main-400 max-h-4 flex items-center">FPS:</span>
          {[5, 15, 30, 60].map((f, i) => (
            <Button key={i}
              onClick={() => setFps && setFps(f)}
              activeClass='bg-yellow-500 hover:bg-yellow-600 text-black dark:bg-yellow-400 dark:hover:bg-yellow-500 dark:text-black'
              active={fps === f}
              className="px-1 text-sm font-medium flex-1 max-h-4"
              disabled={forceFPS !== undefined}
            >
              {f.toString()}
            </Button>
          ))}
        </div>
      )}

      <Button
        onClick={refresh}
        className="max-h-4"
      ><RefreshCw size={16} /></Button>
    </div>
  );
}
