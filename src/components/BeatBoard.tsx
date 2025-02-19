import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Save, Trash2, Zap } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { toast } from "sonner";

interface Frequency {
  freq: number;
  name: string;
  type: OscillatorType;
}

interface Beat {
  frequency: number;
  name: string;
  isActive: boolean;
  type?: OscillatorType;
}

type BeatGrid = Beat[][];

const brainwaveFrequencies = [
  { freq: 2, name: "Delta" },
  { freq: 6, name: "Theta" },
  { freq: 10, name: "Alpha" },
  { freq: 20, name: "Beta" },
  { freq: 40, name: "Gamma" }
];

const allFrequencies: Frequency[] = [
  { freq: 880, name: "880 Hz Sine", type: "sine" },
  { freq: 440, name: "440 Hz Sine", type: "sine" },
  { freq: 330, name: "330 Hz Square", type: "square" },
  { freq: 220, name: "220 Hz Square", type: "square" },
  { freq: 165, name: "165 Hz Triangle", type: "triangle" },
  { freq: 110, name: "110 Hz Triangle", type: "triangle" },
  { freq: 55, name: "55 Hz Sawtooth", type: "sawtooth" },
  { freq: 33, name: "33 Hz Sawtooth", type: "sawtooth" },
  { freq: 22, name: "22 Hz Sine", type: "sine" },
  { freq: 11, name: "11 Hz Sine", type: "sine" }
];

const natureSounds = [
  { name: "Rain", url: "/sounds/rain.mp3" },
  { name: "Thunder", url: "/sounds/thunder.mp3" },
  { name: "River", url: "/sounds/river.mp3" },
  { name: "Forest", url: "/sounds/forest.mp3" }
];

const createInitialGrid = (frequencies: Frequency[]): BeatGrid => {
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

const createPinkNoise = (context: AudioContext) => {
  const bufferSize = 4096;
  const pinkNoiseNode = context.createScriptProcessor(bufferSize, 1, 1);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  pinkNoiseNode.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
  };
  return pinkNoiseNode;
};

const createBrownNoise = (context: AudioContext) => {
  const bufferSize = 4096;
  const brownNoiseNode = context.createScriptProcessor(bufferSize, 1, 1);
  let lastOut = 0;

  brownNoiseNode.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
  };
  return brownNoiseNode;
};

const natureSoundGenerators = {
  Rain: (context: AudioContext, gainNode: GainNode) => {
    const rainGain = context.createGain();
    rainGain.gain.value = 0.5;
    const rainNoise = createPinkNoise(context);
    rainNoise.connect(rainGain);
    rainGain.connect(gainNode);
    return rainNoise;
  },
  Thunder: (context: AudioContext, gainNode: GainNode) => {
    const thunderGain = context.createGain();
    thunderGain.gain.value = 0;
    const thunder = createBrownNoise(context);
    thunder.connect(thunderGain);
    thunderGain.connect(gainNode);
    
    const now = context.currentTime;
    thunderGain.gain.setValueAtTime(0, now);
    thunderGain.gain.linearRampToValueAtTime(1, now + 0.2);
    thunderGain.gain.exponentialRampToValueAtTime(0.3, now + 0.3);
    thunderGain.gain.exponentialRampToValueAtTime(0.00001, now + 2);
    
    setInterval(() => {
      const now = context.currentTime;
      thunderGain.gain.setValueAtTime(0, now);
      thunderGain.gain.linearRampToValueAtTime(1, now + 0.2);
      thunderGain.gain.exponentialRampToValueAtTime(0.3, now + 0.3);
      thunderGain.gain.exponentialRampToValueAtTime(0.00001, now + 2);
    }, 8000);

    return thunder;
  },
  River: (context: AudioContext, gainNode: GainNode) => {
    const riverGain = context.createGain();
    riverGain.gain.value = 0.3;
    const river = createBrownNoise(context);
    
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.7;
    
    river.connect(filter);
    filter.connect(riverGain);
    riverGain.connect(gainNode);
    return river;
  },
  Forest: (context: AudioContext, gainNode: GainNode) => {
    const forestGain = context.createGain();
    forestGain.gain.value = 0.2;
    const forest = createPinkNoise(context);
    
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 0.9;
    
    forest.connect(filter);
    filter.connect(forestGain);
    forestGain.connect(gainNode);
    return forest;
  }
};

export const BeatBoard = () => {
  const [grid, setGrid] = useState<BeatGrid>(createInitialGrid(allFrequencies));
  const [selectedFrequency, setSelectedFrequency] = useState<Frequency>(allFrequencies[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [bpm, setBpm] = useState(120);
  const [currentColumn, setCurrentColumn] = useState(0);
  const [activeWave, setActiveWave] = useState<string | null>(null);
  const [activeNatureSound, setActiveNatureSound] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<any[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const brainwaveOscillatorRef = useRef<OscillatorNode | null>(null);
  const brainwaveGainRef = useRef<GainNode | null>(null);
  const natureSoundRef = useRef<HTMLAudioElement | null>(null);
  const natureSoundNodesRef = useRef<ScriptProcessorNode[]>([]);
  const natureSoundGainRef = useRef<GainNode | null>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

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
          isActive: true,
          type: selectedFrequency.type
        };
      }
      return newGrid;
    });
  }, [selectedFrequency]);

  useEffect(() => {
    let intervalId: number;

    if (isPlaying) {
      const context = initAudioContext();

      const playColumn = (column: number) => {
        // Clean up previous oscillators with proper release
        oscillatorsRef.current.forEach(osc => {
          const now = context.currentTime;
          const gainNode = osc.gainNode;
          if (gainNode) {
            // Add a gentle release to avoid clicks
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            setTimeout(() => {
              try {
                osc.oscillator.stop();
                osc.oscillator.disconnect();
                gainNode.disconnect();
              } catch (e) {
                console.error('Error stopping oscillator:', e);
              }
            }, 100);
          }
        });
        oscillatorsRef.current = [];

        grid.forEach(row => {
          const cell = row[column];
          if (cell.isActive && cell.frequency > 0) {
            try {
              const oscillator = context.createOscillator();
              const gainNode = context.createGain();
              const now = context.currentTime;

              const freqConfig = allFrequencies.find(f => f.freq === cell.frequency);
              oscillator.type = (freqConfig?.type as OscillatorType) || 'sine';
              oscillator.frequency.setValueAtTime(cell.frequency, now);

              // Add attack and sustain to make sound more melodious
              gainNode.gain.setValueAtTime(0, now);
              gainNode.gain.linearRampToValueAtTime(volume, now + 0.02); // Quick attack
              gainNode.gain.setValueAtTime(volume * 0.7, now + 0.02); // Sustain at slightly lower volume

              oscillator.connect(gainNode);
              gainNode.connect(context.destination);

              oscillator.start(now);
              oscillatorsRef.current.push({ 
                oscillator, 
                gainNode,
                startTime: now 
              });
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
        const now = context.currentTime;
        oscillatorsRef.current.forEach(({ oscillator, gainNode }) => {
          try {
            if (gainNode) {
              gainNode.gain.setValueAtTime(gainNode.gain.value, now);
              gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            }
            setTimeout(() => {
              oscillator.stop();
              oscillator.disconnect();
              gainNode?.disconnect();
            }, 100);
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
    if (natureSoundGainRef.current) {
      natureSoundGainRef.current.gain.setValueAtTime(volume, audioContextRef.current?.currentTime || 0);
    }
  }, [volume]);

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

  const playNatureSound = (name: string) => {
    const context = initAudioContext();

    natureSoundNodesRef.current.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        console.error('Error stopping nature sound:', e);
      }
    });
    natureSoundNodesRef.current = [];

    if (activeNatureSound === name) {
      setActiveNatureSound(null);
      return;
    }

    try {
      if (!natureSoundGainRef.current) {
        natureSoundGainRef.current = context.createGain();
        natureSoundGainRef.current.connect(context.destination);
      }
      
      natureSoundGainRef.current.gain.value = volume;
      
      const generator = natureSoundGenerators[name as keyof typeof natureSoundGenerators];
      if (generator) {
        const soundNode = generator(context, natureSoundGainRef.current);
        natureSoundNodesRef.current.push(soundNode);
        setActiveNatureSound(name);
        toast.success(`Playing ${name} sound`);
      }
    } catch (e) {
      console.error('Error generating nature sound:', e);
      toast.error(`Failed to generate ${name} sound`);
    }
  };

  useEffect(() => {
    if (natureSoundGainRef.current) {
      natureSoundGainRef.current.gain.setValueAtTime(volume, audioContextRef.current?.currentTime || 0);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      natureSoundNodesRef.current.forEach(node => {
        try {
          node.disconnect();
        } catch (e) {
          console.error('Error cleaning up nature sound:', e);
        }
      });
    };
  }, []);

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
          osc.oscillator.stop();
          osc.oscillator.disconnect();
          osc.gainNode.disconnect();
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
              {Object.keys(natureSoundGenerators).map((sound) => (
                <Button
                  key={sound}
                  onClick={() => playNatureSound(sound)}
                  variant="outline"
                  className={`gap-2 ${
                    activeNatureSound === sound
                      ? 'bg-cyan-500 text-white'
                      : 'border-cyan-500 text-cyan-500 hover:bg-cyan-500/10'
                  }`}
                >
                  {sound}
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
