
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Save } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';

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

  const handleCellClick = (row: number, col: number) => {
    if (!selectedFrequency) return;

    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      newGrid[row] = [...newGrid[row]];
      newGrid[row][col] = {
        frequency: selectedFrequency.freq,
        name: selectedFrequency.name,
        isActive: true
      };
      return newGrid;
    });
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentColumn(0);
      // Start playback logic would go here
    }
  };

  const handleSave = () => {
    // Save functionality would go here
    console.log('Saving beat pattern:', grid);
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
          <h2 className="text-xl font-semibold mb-4">Available Frequencies</h2>
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

        <div className="grid grid-cols-10 gap-1 mb-8">
          {grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={`
                  aspect-square rounded-md border-2 transition-all duration-200
                  ${cell.isActive 
                    ? 'bg-primary border-primary' 
                    : 'bg-card border-accent hover:border-primary'}
                  ${currentColumn === colIndex ? 'ring-2 ring-primary ring-offset-2' : ''}
                `}
              >
                {cell.isActive && (
                  <span className="text-xs text-primary-foreground">
                    {cell.name}
                  </span>
                )}
              </button>
            ))
          ))}
        </div>
      </div>
    </div>
  );
};
