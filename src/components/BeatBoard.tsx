
import { useState, useCallback } from 'react';
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

const allFrequencies = [
  // Solfeggio frequencies
  { freq: 174, name: "174 Hz" },
  { freq: 285, name: "285 Hz" },
  { freq: 396, name: "396 Hz" },
  { freq: 417, name: "417 Hz" },
  { freq: 432, name: "432 Hz" },
  { freq: 528, name: "528 Hz" },
  { freq: 639, name: "639 Hz" },
  { freq: 741, name: "741 Hz" },
  { freq: 852, name: "852 Hz" },
  { freq: 963, name: "963 Hz" },
  // Brainwave frequencies
  { freq: 2, name: "Delta" },
  { freq: 6, name: "Theta" },
  { freq: 10, name: "Alpha" },
  { freq: 20, name: "Beta" },
  { freq: 40, name: "Gamma" }
];

export const BeatBoard = () => {
  const [grid, setGrid] = useState<BeatGrid>(createInitialGrid(allFrequencies));
  const [selectedFrequency, setSelectedFrequency] = useState<{ freq: number; name: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentColumn, setCurrentColumn] = useState(0);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!selectedFrequency) return;

    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      newGrid[row] = [...newGrid[row]];
      const currentCell = newGrid[row][col];
      
      // Toggle the cell if it's already active with the same frequency
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

  const clearGrid = () => {
    setGrid(createInitialGrid(allFrequencies));
    toast.success("Grid cleared");
  };

  const applyPreset = (preset: keyof typeof presets) => {
    const selectedPreset = presets[preset];
    setGrid(prevGrid => {
      const newGrid = createInitialGrid(allFrequencies);
      
      // Apply preset pattern
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
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentColumn(0);
      toast.success("Playback started");
    } else {
      toast.info("Playback paused");
    }
  };

  const handleSave = () => {
    // Save functionality would go here
    console.log('Saving beat pattern:', grid);
    toast.success("Beat pattern saved");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Beat Sequencer</h1>
          <p className="text-lg text-muted-foreground">
            Create your own beats by selecting frequencies and placing them on the grid
          </p>
        </header>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Frequencies</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={clearGrid}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Grid
              </Button>
              <Button
                variant="outline"
                onClick={() => applyPreset('meditation')}
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Meditation Preset
              </Button>
              <Button
                variant="outline"
                onClick={() => applyPreset('focus')}
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Focus Preset
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {allFrequencies.map((freq) => (
              <Button
                key={freq.freq}
                variant={selectedFrequency?.freq === freq.freq ? "default" : "outline"}
                onClick={() => setSelectedFrequency(freq)}
                className="transition-all duration-200"
              >
                {freq.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={togglePlay}
              variant="default"
              size="icon"
              className="w-12 h-12 rounded-full"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[volume]}
                onValueChange={(newVolume) => setVolume(newVolume[0])}
                max={1}
                step={0.01}
              >
                <Slider.Track className="bg-secondary relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-primary rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block h-4 w-4 rounded-full bg-primary shadow-lg" />
              </Slider.Root>
            </div>
            <Button onClick={handleSave} variant="outline" className="gap-2">
              <Save className="w-4 h-4" />
              Save Beat
            </Button>
          </div>
        </div>

        <div className="relative">
          {/* Moving line indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-primary transition-all duration-200 z-10"
            style={{ 
              left: `${(currentColumn * 100) / 10}%`,
              transform: 'translateX(-50%)',
              opacity: isPlaying ? 1 : 0
            }}
          />

          <div className="grid grid-cols-10 gap-1 mb-8">
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`
                    group relative aspect-square rounded-md border-2 transition-all duration-200 overflow-hidden
                    ${cell.isActive 
                      ? 'bg-primary border-primary animate-pulse-glow' 
                      : 'bg-card border-accent hover:border-primary'}
                    ${currentColumn === colIndex ? 'ring-2 ring-primary ring-offset-2' : ''}
                  `}
                >
                  {cell.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center p-1">
                      <div className="text-[0.6rem] text-primary-foreground text-center leading-tight">
                        <div className="font-semibold">{cell.name}</div>
                        <div className="opacity-75">{cell.frequency} Hz</div>
                      </div>
                    </div>
                  )}
                  {!cell.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-50 transition-opacity">
                      <div className="text-[0.6rem] text-foreground">Click to add beat</div>
                    </div>
                  )}
                </button>
              ))
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
