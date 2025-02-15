
import { useState, useEffect, useRef } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FrequencyPlayerProps {
  frequency: number;
  name: string;
  description?: string;
}

export const FrequencyPlayer = ({ frequency, name, description }: FrequencyPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();

      oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      oscillatorRef.current.start();
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        isPlaying ? 0 : volume,
        audioContextRef.current?.currentTime || 0
      );
    }

    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const value = newVolume[0];
    setVolume(value);
    if (gainNodeRef.current && isPlaying) {
      gainNodeRef.current.gain.setValueAtTime(
        value,
        audioContextRef.current?.currentTime || 0
      );
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border border-accent transition-all duration-300 hover:border-primary">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{frequency} Hz</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Button
          onClick={togglePlay}
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-full transition-all duration-300 ${
            isPlaying ? 'bg-primary text-primary-foreground' : ''
          }`}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.01}
        >
          <Slider.Track className="bg-secondary relative grow rounded-full h-1">
            <Slider.Range className="absolute bg-primary rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb className="block h-4 w-4 rounded-full bg-primary shadow-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </Slider.Root>
      </div>
    </div>
  );
};
