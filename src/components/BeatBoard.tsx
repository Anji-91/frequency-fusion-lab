import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Save, Trash2, Zap } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { toast } from "sonner";

interface Beat {
  frequency: number;
  name: string;
  isActive: boolean;
}

type BeatGrid = Beat[][];

const brainwaveFrequencies = [
  { freq: 2, name: "Delta" },
  { freq: 6, name: "Theta" },
  { freq: 10, name: "Alpha" },
  { freq: 20, name: "Beta" },
  { freq: 40, name: "Gamma" }
];

const allFrequencies = [
  { freq: 174, name: "174 Hz" },
  { freq: 285, name: "285 Hz" },
  { freq: 396, name: "396 Hz" },
  { freq: 417, name: "417 Hz" },
  { freq: 432, name: "432 Hz" },
  { freq: 528, name: "528 Hz" },
  { freq: 639, name: "639 Hz" },
  { freq: 741, name: "741 Hz" },
  { freq: 852, name: "852 Hz" },
  { freq: 963, name: "963 Hz" }
];

const natureSounds = [
  { name: "Rain", url: "/sounds/rain.mp3" },
  { name: "Thunder", url: "/sounds/thunder.mp3" },
  { name: "River", url: "/sounds/river.mp3" },
  { name: "Forest", url: "/sounds/forest.mp3" }
];

const createInitialGrid = (frequencies: { freq: number; name: string }[]): BeatGrid => {
  const grid: BeatGrid = [];
  for (let i = 0; i < 10; i++) {
    grid[i] = [];
    for (let j = 0; j < 10; j++) {
      grid[i][j] = {
        frequency: 0,
        name: '',
        isActive: false
      };
    }
  }
  return grid;
};

const presets = {
  meditation: {
    name: "Meditation",
    description: "Calm theta waves with healing frequencies",
    frequencies: [
      { freq: 6, name: "Theta" },
      { freq: 432, name: "432 Hz" },
      { freq: 528, name: "528 Hz" }
    ]
  },
  focus: {
    name: "Focus",
    description: "Beta waves for concentration",
    frequencies: [
      { freq: 20, name: "Beta" },
      { freq: 396, name: "396 Hz" }
    ]
  }
};

export const BeatBoard = () => {
  const [grid, setGrid] = useState<BeatGrid>(createInitialGrid(allFrequencies));
  const [selectedFrequency, setSelectedFrequency] = useState<{ freq: number; name: string }>(allFrequencies[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [bpm, setBpm] = useState(120);
  const [currentColumn, setCurrentColumn] = useState(0);
  const [activeWave, setActiveWave] = useState<string | null>(null);
  const [activeNatureSound, setActiveNatureSound] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const brainwaveOscillatorRef = useRef<OscillatorNode | null>(null);
  const brainwaveGainRef = useRef<GainNode | null>(null);
  const natureSoundRef = useRef<HTMLAudioElement | null>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  useEffect(() => {
    let intervalId: number;

    if (isPlaying) {
      const context = initAudioContext();

      const playColumn = (column: number) => {
        oscillatorsRef.current.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {
            console.error('Error stopping oscillator:', e);
          }
        });
        oscillatorsRef.current = [];
        gainNodesRef.current = [];

        grid.forEach(row => {
          const cell = row[column];
          if (cell.isActive && cell.frequency > 0) {
            try {
              const oscillator = context.createOscillator();
              const gainNode = context.createGain();

              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(cell.frequency, context.currentTime);
              gainNode.gain.setValueAtTime(volume, context.currentTime);

              oscillator.connect(gainNode);
              gainNode.connect(context.destination);

              oscillator.start();
              oscillatorsRef.current.push(oscillator);
              gainNodesRef.current.push(gainNode);
            } catch (e) {
              console.error('Error playing frequency:', e);
            }
          }
        });
      };

      const intervalMs = 60000 / bpm;
      intervalId = window.setInterval(() => {
        playColumn(currentColumn);
        setCurrentColumn(prev => (prev + 1) % 10);
      }, intervalMs);

      return () => {
        window.clearInterval(intervalId);
        oscillatorsRef.current.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {
            console.error('Error cleaning up oscillator:', e);
          }
        });
        oscillatorsRef.current = [];
      };
    }
  }, [isPlaying, grid, volume, currentColumn, bpm]);

  useEffect(() => {
    gainNodesRef.current.forEach(gain => {
      gain.gain.setValueAtTime(volume, audioContextRef.current?.currentTime || 0);
    });
    if (brainwaveGainRef.current) {
      brainwaveGainRef.current.gain.setValueAtTime(volume, audioContextRef.current?.currentTime || 0);
    }
    if (natureSoundRef.current) {
      natureSoundRef.current.volume = volume;
    }
  }, [volume]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!selectedFrequency) return;
    
    initAudioContext();

    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      newGrid[row] = [...newGrid[row]];
      const currentCell = newGrid[row][col];
      
      if (currentCell.isActive && currentCell.frequency === selectedFrequency.freq) {
        newGrid[row][col] = {
          frequency: 0,
          name: '',
          isActive: false
        };
      } else {
        newGrid[row][col] = {
          frequency: selectedFrequency.freq,
          name: selectedFrequency.name,
          isActive: true
        };

        try {
          const context = audioContextRef.current!;
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(selectedFrequency.freq, context.currentTime);
          gainNode.gain.setValueAtTime(volume, context.currentTime);
          
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            oscillator.disconnect();
          }, 100);
        } catch (e) {
          console.error('Error playing preview sound:', e);
        }
      }
      return newGrid;
    });
  }, [selectedFrequency, volume]);

  const playBrainwave = (frequency: number, name: string) => {
    const context = initAudioContext();

    if (brainwaveOscillatorRef.current) {
      try {
        brainwaveOscillatorRef.current.stop();
        brainwaveOscillatorRef.current.disconnect();
        brainwaveOscillatorRef.current = null;
      } catch (e) {
        console.error('Error stopping brainwave:', e);
      }
    }

    if (activeWave === name) {
      setActiveWave(null);
      return;
    }

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gainNode.gain.setValueAtTime(volume, context.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      brainwaveOscillatorRef.current = oscillator;
      brainwaveGainRef.current = gainNode;
      setActiveWave(name);
      toast.success(`Playing ${name} wave (${frequency} Hz)`);
    } catch (e) {
      console.error('Error playing brainwave:', e);
      toast.error(`Failed to play ${name} wave`);
    }
  };

  const playNatureSound = (name: string, url: string) => {
    if (natureSoundRef.current) {
      natureSoundRef.current.pause();
      natureSoundRef.current = null;
      if (activeNatureSound === name) {
        setActiveNatureSound(null);
        return;
      }
    }

    try {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = volume;
      
      audio.addEventListener('canplaythrough', () => {
        audio.play()
          .then(() => {
            natureSoundRef.current = audio;
            setActiveNatureSound(name);
            toast.success(`Playing ${name} sound`);
          })
          .catch((error) => {
            console.error('Error playing nature sound:', error);
            toast.error(`Failed to play ${name} sound`);
          });
      });

      audio.addEventListener('error', (e) => {
        console.error('Error loading nature sound:', e);
        toast.error(`Failed to load ${name} sound`);
      });
    } catch (e) {
      console.error('Error setting up nature sound:', e);
      toast.error(`Failed to setup ${name} sound`);
    }
  };

  const clearGrid = () => {
    setGrid(createInitialGrid(allFrequencies));
    toast.success("Grid cleared");
  };

  const applyPreset = (preset: keyof typeof presets) => {
    const selectedPreset = presets[preset];
    setGrid(prevGrid => {
      const newGrid = createInitialGrid(allFrequencies);
      
      selectedPreset.frequencies.forEach((freq, index) => {
        if (index < 10) {
          newGrid[index][0] = {
            frequency: freq.freq,
            name: freq.name,
            isActive: true
          };
        }
      });
      
      return newGrid;
    });
    toast.success(`Applied ${presets[preset].name} preset`);
  };

  const togglePlay = () => {
    if (!isPlaying) {
      initAudioContext();
      setCurrentColumn(0);
      toast.success("Playback started");
    } else {
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          console.error('Error stopping oscillator:', e);
        }
      });
      oscillatorsRef.current = [];
      toast.info("Playback paused");
    }
    setIsPlaying(prev => !prev);
  };

  const handleSave = () => {
    console.log('Saving beat pattern:', grid);
    toast.success("Beat pattern saved");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={togglePlay}
                variant="default"
                size="icon"
                className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-600"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs text-gray-400">Volume</span>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[volume]}
                    onValueChange={(newVolume) => setVolume(newVolume[0])}
                    max={1}
                    step={0.01}
                  >
                    <Slider.Track className="bg-gray-800 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-cyan-500 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block h-4 w-4 rounded-full bg-cyan-500 shadow-lg" />
                  </Slider.Root>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs text-gray-400">BPM</span>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[bpm]}
                    onValueChange={(newBpm) => setBpm(newBpm[0])}
                    min={60}
                    max={240}
                    step={1}
                  >
                    <Slider.Track className="bg-gray-800 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-cyan-500 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block h-4 w-4 rounded-full bg-cyan-500 shadow-lg" />
                  </Slider.Root>
                  <span className="text-xs text-cyan-500 min-w-[3ch]">{bpm}</span>
                </div>
              </div>
              <Button onClick={handleSave} variant="outline" className="gap-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500/10">
                <Save className="w-4 h-4" />
                Save Beat
              </Button>
            </div>

            <div className="flex gap-2 mb-4">
              {brainwaveFrequencies.map((wave) => (
                <Button
                  key={wave.freq}
                  onClick={() => playBrainwave(wave.freq, wave.name)}
                  variant="outline"
                  className={`gap-2 ${
                    activeWave === wave.name
                      ? 'bg-cyan-500 text-white'
                      : 'border-cyan-500 text-cyan-500 hover:bg-cyan-500/10'
                  }`}
                >
                  {wave.name}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              {natureSounds.map((sound) => (
                <Button
                  key={sound.name}
                  onClick={() => playNatureSound(sound.name, sound.url)}
                  variant="outline"
                  className={`gap-2 ${
                    activeNatureSound === sound.name
                      ? 'bg-cyan-500 text-white'
                      : 'border-cyan-500 text-cyan-500 hover:bg-cyan-500/10'
                  }`}
                >
                  {sound.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex overflow-x-auto">
          <div className="w-48 flex flex-col gap-1 pr-4">
            {allFrequencies.map((freq) => (
              <button
                key={freq.freq}
                onClick={() => setSelectedFrequency(freq)}
                className={`h-16 flex items-center px-4 rounded transition-all duration-200 ${
                  selectedFrequency?.freq === freq.freq
                    ? 'bg-cyan-500/20 text-cyan-500'
                    : 'text-cyan-500 hover:bg-cyan-500/10'
                }`}
              >
                <span className="text-sm font-mono">{freq.name}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 relative">
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-500 transition-all duration-200 z-10"
              style={{ 
                left: `${(currentColumn * 100) / 10}%`,
                transform: 'translateX(-50%)',
                opacity: isPlaying ? 1 : 0
              }}
            />

            <div className="grid grid-cols-10 gap-1">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="contents">
                  {row.map((cell, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className={`
                        relative h-16 rounded border transition-all duration-200
                        ${cell.isActive 
                          ? 'bg-cyan-500/20 border-cyan-500' 
                          : 'bg-transparent border-gray-800 hover:border-cyan-500/50'}
                        ${currentColumn === colIndex ? 'ring-1 ring-cyan-500 ring-offset-1 ring-offset-[#0A0A0A]' : ''}
                      `}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={clearGrid}
            className="gap-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
          >
            <Trash2 className="w-4 h-4" />
            Clear Grid
          </Button>
          <Button
            variant="outline"
            onClick={() => applyPreset('meditation')}
            className="gap-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
          >
            <Zap className="w-4 h-4" />
            Meditation Preset
          </Button>
          <Button
            variant="outline"
            onClick={() => applyPreset('focus')}
            className="gap-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
          >
            <Zap className="w-4 h-4" />
            Focus Preset
          </Button>
        </div>
      </div>
    </div>
  );
};
