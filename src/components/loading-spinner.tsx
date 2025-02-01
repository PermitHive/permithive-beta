import Image from 'next/image'
import { useEffect, useState } from 'react'

const loadingPuns = [
  "Goose fetching your data... Honk honk!",
  "Waddling through the database...",
  "Flocking amazing things together...",
  "Getting all our ducks (and geese) in a row...",
  "Honk if you love loading screens...",
  "Flying through the cloud servers...",
  "Nesting your request...",
  "Goose.exe is running...",
  "Egg-secuting your request..."
];

function useLoadingText() {
  // Start with first pun to avoid hydration mismatch
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Randomize only on client-side
    setCurrentIndex(Math.floor(Math.random() * loadingPuns.length));
    
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % loadingPuns.length);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return loadingPuns[currentIndex];
}

export default function LoadingSpinner() {
  const loadingText = useLoadingText();

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-3">
      <div className="w-24 h-24 relative">
        <Image
          src="/goose-gif.gif"
          alt="Loading goose"
          fill
          className="object-contain"
          priority
        />
      </div>
      <p className="text-gray-600 animate-pulse font-heading text-sm">
        {loadingText}
      </p>
    </div>
  );
}

export function LoadingScreen() {
  const loadingText = useLoadingText();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-40 h-40 relative">
        <Image
          src="/goose-gif.gif"
          alt="Loading goose"
          fill
          className="object-contain"
          priority
        />
      </div>
      <p className="text-gray-600 animate-pulse font-heading text-lg">
        {loadingText}
      </p>
    </div>
  );
} 