export default function LoadingTeamData() {
  return (
    <div className="bg-white rounded-xl p-16 text-center">
      <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      <p className="mt-4 text-sm text-gray-500">Loading team data...</p>
    </div>
  );
}

