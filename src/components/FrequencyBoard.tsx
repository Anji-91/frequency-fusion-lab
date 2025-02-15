
import { FrequencyPlayer } from './FrequencyPlayer';

const frequencies = {
  solfeggio: [
    { freq: 174, name: "174 Hz", description: "Pain reduction & healing" },
    { freq: 285, name: "285 Hz", description: "Healing of tissues & organs" },
    { freq: 396, name: "396 Hz", description: "Liberation from fear" },
    { freq: 417, name: "417 Hz", description: "Facilitating change" },
    { freq: 432, name: "432 Hz", description: "Universal harmony" },
    { freq: 528, name: "528 Hz", description: "DNA repair & transformation" },
    { freq: 639, name: "639 Hz", description: "Relationships & harmony" },
    { freq: 741, name: "741 Hz", description: "Awakening intuition" },
    { freq: 852, name: "852 Hz", description: "Spiritual awareness" },
    { freq: 963, name: "963 Hz", description: "Divine consciousness" },
  ],
  brainwaves: [
    { freq: 2, name: "Delta Waves", description: "Deep sleep (0.5-4 Hz)" },
    { freq: 6, name: "Theta Waves", description: "Meditation (4-8 Hz)" },
    { freq: 10, name: "Alpha Waves", description: "Relaxation (8-12 Hz)" },
    { freq: 20, name: "Beta Waves", description: "Focus (13-30 Hz)" },
    { freq: 40, name: "Gamma Waves", description: "Insight (30-100 Hz)" },
  ],
};

export const FrequencyBoard = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Frequency Board</h1>
          <p className="text-lg text-muted-foreground">
            Explore healing frequencies and create your own sonic experience
          </p>
        </header>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Solfeggio Frequencies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frequencies.solfeggio.map((freq) => (
                <FrequencyPlayer
                  key={freq.freq}
                  frequency={freq.freq}
                  name={freq.name}
                  description={freq.description}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Brainwave Frequencies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frequencies.brainwaves.map((freq) => (
                <FrequencyPlayer
                  key={freq.freq}
                  frequency={freq.freq}
                  name={freq.name}
                  description={freq.description}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
