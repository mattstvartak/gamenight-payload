import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-6xl mb-6" role="img" aria-label="Dice icon">🎲</div>
      <h2 className="text-2xl font-bold mb-4">Player Not Found!</h2>
      <p className="text-gray-600 mb-6 text-center">
        Looks like this player hasn&apos;t joined the game yet.
        <br />
        Roll again to find another player!
      </p>
      <Link
        href="/"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
      >
        <span>Roll Home</span> 🎲
      </Link>
    </div>
  );
} 