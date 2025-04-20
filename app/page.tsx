import AmbulanceGame from "@/components/ambulance-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-4xl font-bold mb-6 text-blue-800">Ambulance Simulation</h1>
      <p className="text-lg mb-8 text-gray-700 max-w-2xl text-center">
        Place the ambulance, hospital, and obstacles on the grid. Watch as the ambulance finds the shortest path using
        the A* algorithm!
      </p>
      <AmbulanceGame />
    </main>
  )
}
