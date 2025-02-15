
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, AudioWaveform } from 'lucide-react';

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
            >
              <Music className="h-6 w-6" />
              <span className="font-semibold text-lg">Frequency Lab</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Button
                variant={location.pathname === "/" ? "default" : "ghost"}
                asChild
              >
                <Link to="/" className="flex items-center space-x-2">
                  <AudioWaveform className="h-4 w-4" />
                  <span>Frequency Board</span>
                </Link>
              </Button>
              <Button
                variant={location.pathname === "/beat-sequencer" ? "default" : "ghost"}
                asChild
              >
                <Link to="/beat-sequencer" className="flex items-center space-x-2">
                  <Music className="h-4 w-4" />
                  <span>Beat Sequencer</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
