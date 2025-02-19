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

const allFrequencies: Frequency[] = [
  { freq: 40, name: "Gamma", type: "sine" },
  { freq: 0, name: "Rain", type: "sine" },
  { freq: 0, name: "Thunder", type: "sine" },
  { freq: 0, name: "River", type: "sine" },
  { freq: 0, name: "Forest", type: "sine" }
];

const natureSounds = [
  { name: "Rain", url: "/sounds/rain.mp3" },
  { name: "Thunder", url: "/sounds/thunder.mp3" },
  { name: "River", url: "/sounds/river.mp3" },
  { name: "Forest", url: "/sounds/forest.mp3" }
];

const createInitialGrid = (frequencies: Frequency[]): BeatGrid => {
  const grid: BeatGrid = [];
  for (let i = 0; i < frequencies.length; i++) {
    grid[i] = [];
    for (let j = 0; j < 10; j++) {
      grid[i][j] = {
        frequency: 0,
        name: '',
        isActive: false,
        type: frequencies[i].type
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
      
      const rowFrequency = allFrequencies[row];
      
      if (currentCell.isActive) {
        newGrid[row][col] = {
          frequency: 0,
          name: '',
          isActive: false,
          type: rowFrequency.type
        };
      } else {
        newGrid[row][col] = {
          frequency: rowFrequency.freq,
          name: rowFrequency.name,
          isActive: true,
          type: rowFrequency.type
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
        oscillatorsRef.current.forEach(osc => {
          const now = context.currentTime;
          const gainNode = osc.gainNode;
          if (gainNode) {
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

        grid.forEach((row, rowIndex) => {
          const cell = row[column];
          if (cell.isActive) {
            try {
              const rowFrequency = allFrequencies[rowIndex];
              if (!rowFrequency) return;

              const oscillator = context.createOscillator();
              const gainNode = context.createGain();
              const now = context.currentTime;

              oscillator.type = rowFrequency.type;
              oscillator.frequency.setValueAtTime(rowFrequency.freq, now);

              gainNode.gain.setValueAtTime(0, now);
              gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
              gainNode.gain.setValueAtTime(volume * 0.7, now + 0.02);

              oscillator.connect(gainNode);
              gainNode.connect(context.destination);

              oscillator.start(now);
              
              oscillatorsRef.current.push({
                oscillator,
                gainNode,
                startTime: now,
                frequency: rowFrequency.freq,
                type: rowFrequency.type
              });

              console.log(`Playing cell at row ${rowIndex}, column ${column}: frequency ${rowFrequency.freq}Hz, type ${rowFrequency.type}`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white/10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={togglePlay}
                variant="default"
                size="icon"
                className="w-14 h-14 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm text-purple-200">Volume</span>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[volume]}
                    onValueChange={(newVolume) => setVolume(newVolume[0])}
                    max={1}
                    step={0.01}
                  >
                    <Slider.Track className="bg-purple-950 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-purple-500 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block h-4 w-4 rounded-full bg-white shadow-lg ring-2 ring-purple-500 focus:outline-none focus:ring-purple-500" />
                  </Slider.Root>
                </div>
                
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm text-purple-200">BPM</span>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[bpm]}
                    onValueChange={(newBpm) => setBpm(newBpm[0])}
                    min={60}
                    max={240}
                    step={1}
                  >
                    <Slider.Track className="bg-purple-950 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-purple-500 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block h-4 w-4 rounded-full bg-white shadow-lg ring-2 ring-purple-500 focus:outline-none focus:ring-purple-500" />
                  </Slider.Root>
                  <span className="text-sm text-purple-200 min-w-[3ch]">{bpm}</span>
                </div>
              </div>
              
              <Button 
                onClick={handleSave} 
                variant="outline" 
                className="gap-2 border-purple-500 text-purple-200 hover:bg-purple-500/10"
              >
                <Save className="w-4 h-4" />
                Save Beat
              </Button>
            </div>

            <div className="flex gap-2 mb-4">
              {Object.keys(natureSoundGenerators).map((sound) => (
                <Button
                  key={sound}
                  onClick={() => playNatureSound(sound)}
                  variant="outline"
                  className={`gap-2 ${
                    activeNatureSound === sound
                      ? 'bg-purple-500 text-white'
                      : 'border-purple-500 text-purple-200 hover:bg-purple-500/10'
                  }`}
                >
                  {sound}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative bg-black/30 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white/10">
          <div className="flex overflow-x-auto">
            <div className="w-48 flex flex-col gap-1 pr-4">
              {allFrequencies.map((freq) => (
                <button
                  key={freq.freq}
                  onClick={() => setSelectedFrequency(freq)}
                  className={`h-16 flex items-center px-4 rounded transition-all duration-200 ${
                    selectedFrequency?.freq === freq.freq
                      ? 'bg-purple-500/20 text-purple-200'
                      : 'text-purple-200 hover:bg-purple-500/10'
                  }`}
                >
                  <span className="text-sm font-mono">{freq.name}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 relative">
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-purple-500 transition-all duration-200 z-10"
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
                            ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20' 
                            : 'bg-transparent border-purple-900 hover:border-purple-500/50'}
                          ${currentColumn === colIndex ? 'ring-1 ring-purple-500 ring-offset-1 ring-offset-transparent' : ''}
                        `}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={clearGrid}
            className="gap-2 border-purple-500 text-purple-200 hover:bg-purple-500/10"
          >
            <Trash2 className="w-4 h-4" />
            Clear Grid
          </Button>
          <Button
            variant="outline"
            onClick={() => applyPreset('meditation')}
            className="gap-2 border-purple-500 text-purple-200 hover:bg-purple-500/10"
          >
            <Zap className="w-4 h-4" />
            Meditation Preset
          </Button>
          <Button
            variant="outline"
            onClick={() => applyPreset('focus')}
            className="gap-2 border-purple-500 text-purple-200 hover:bg-purple-500/10"
          >
            <Zap className="w-4 h-4" />
            Focus Preset
          </Button>
        </div>
      </div>
    </div>
  );
};
