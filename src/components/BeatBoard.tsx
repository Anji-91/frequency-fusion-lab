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

  useEffect(() => {
    let intervalId: number;

    if (isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const playColumn = (column: number) => {
        oscillatorsRef.current.forEach(osc => osc.stop());
        oscillatorsRef.current = [];
        gainNodesRef.current = [];

        grid.forEach(row => {
          const cell = row[column];
          if (cell.isActive) {
            const oscillator = audioContextRef.current!.createOscillator();
            const gainNode = audioContextRef.current!.createGain();

            oscillator.frequency.value = cell.frequency;
            gainNode.gain.value = volume;

            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current!.destination);

            oscillator.start();
            oscillatorsRef.current.push(oscillator);
            gainNodesRef.current.push(gainNode);
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
        oscillatorsRef.current.forEach(osc => osc.stop());
        oscillatorsRef.current = [];
      };
    }
  }, [isPlaying, grid, volume, currentColumn, bpm]);

  useEffect(() => {
    gainNodesRef.current.forEach(gain => {
      gain.gain.value = volume;
    });
  }, [volume]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!selectedFrequency) return;

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
      }
      return newGrid;
    });
  }, [selectedFrequency]);

  const playNatureSound = (name: string, url: string) => {
    if (natureSoundRef.current) {
      natureSoundRef.current.pause();
      natureSoundRef.current = null;
    }

    if (activeNatureSound === name) {
      setActiveNatureSound(null);
      return;
    }

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume;
    audio.play();
    natureSoundRef.current = audio;
    setActiveNatureSound(name);
    toast.success(`Playing ${name} sound`);
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
    setIsPlaying(prev => !prev);
    if (!isPlaying) {
      setCurrentColumn(0);
      toast.success("Playback started");
    } else {
      oscillatorsRef.current.forEach(osc => osc.stop());
      oscillatorsRef.current = [];
      toast.info("Playback paused");
    }
  };

  const handleSave = () => {
    console.log('Saving beat pattern:', grid);
    toast.success("Beat pattern saved");
  };

  const playBrainwave = (frequency: number, name: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (brainwaveOscillatorRef.current) {
      brainwaveOscillatorRef.current.stop();
      brainwaveOscillatorRef.current = null;
    }

    if (activeWave === name) {
      setActiveWave(null);
      return;
    }

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.start();
    brainwaveOscillatorRef.current = oscillator;
    brainwaveGainRef.current = gainNode;
    setActiveWave(name);
    toast.success(`Playing ${name} wave (${frequency} Hz)`);
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
