import { GraduationCap, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleSelect = (role: 'student' | 'owner') => {
    // Navigate to login with the selected role state
    navigate('/login', { state: { role } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">UniBoard</h1>
        <p className="text-gray-600">Find your perfect boarding place today</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-center mb-8">Who are you?</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Card */}
          <button
            onClick={() => handleSelect('student')}
            className="group flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary hover:bg-blue-50 transition-all duration-200"
          >
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
              <GraduationCap size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">University Student</h3>
            <p className="text-sm text-gray-500 text-center">
              Search and book verified boarding houses near your campus.
            </p>
          </button>

          {/* Owner Card */}
          <button
            onClick={() => handleSelect('owner')}
            className="group flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary hover:bg-blue-50 transition-all duration-200"
          >
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Building2 size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Boarding Owner</h3>
            <p className="text-sm text-gray-500 text-center">
              List your property, manage bookings, and find tenants easily.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;