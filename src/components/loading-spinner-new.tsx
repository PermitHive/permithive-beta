import Image from 'next/image'
import { useEffect, useState } from 'react'

const loadingPuns = [
  "Goose is migrating your data...",
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
  const [text, setText] = useState(() => {
    // Initialize with a random pun
    const randomIndex = Math.floor(Math.random() * loadingPuns.length);
    return loadingPuns[randomIndex];
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setText(currentText => {
        const currentIndex = loadingPuns.indexOf(currentText);
        const nextIndex = (currentIndex + 1) % loadingPuns.length;
        return loadingPuns[nextIndex];
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return text;
}

export default function LoadingSpinner() {
  const loadingText = useLoadingText();

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-3">
      <div className="w-20 h-20 relative">
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
      <div className="w-32 h-32 relative">
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