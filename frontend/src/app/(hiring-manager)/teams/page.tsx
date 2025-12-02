import TeamMain from "./teamview";
import AllTeamsMapWrapper from "./components/all-teams-map-wrapper";

export default function TeamsPage() {
  return (
    <>
      {/* Header with Title */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Indonesian Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage teams and employees</p>
        </div>
      </div>

      {/* Map */}
      <AllTeamsMapWrapper />
      
      {/* Team View */}
      <TeamMain />
    </>
  );
}

