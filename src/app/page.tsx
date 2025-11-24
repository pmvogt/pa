import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-2">
        <div className="relative flex flex-col items-center justify-center">
          <Image
            src="/pfp.jpg"
            alt="Profile picture"
            width={100}
            height={100}
            className="rounded-full object-cover shadow-lg"
            priority
          />
        </div>
        <h1 className="text-2xl text-amber-100 font-semibold">New site under construction</h1>
      </div>
    </div>
  );
}
