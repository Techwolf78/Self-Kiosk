import { useState, useEffect } from 'react';
import { db, ref, onValue } from '../../../backend/firebase'; // Correct import from backend/firebase.js
import { Bar } from 'react-chartjs-2'; // Importing chart.js to display a visual diagram
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register necessary chart elements
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // Default filter is 'All'

  const fetchGuests = () => {
    const guestsRef = ref(db, 'Data');

    // Real-time listener for Firebase Realtime Database
    onValue(guestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const guestsList = [];
        snapshot.forEach((childSnapshot) => {
          const guest = childSnapshot.val();
          guestsList.push({
            id: childSnapshot.key,
            barcode: guest.barcode,
            name: guest.name,
            status: guest.status || 'Pending', // Default status if not set
          });
        });
        setGuests(guestsList); // Set the state with fetched guest data
      } else {
        console.log('No guests found.');
      }
      setLoading(false); // Stop loading when data is fetched
    });
  };

  // Filter the guests based on the selected filter
  const filteredGuests = guests.filter(guest => {
    if (filter === 'All') return true; // No filter, show all guests
    return guest.status === filter;
  });

  // Count the different statuses for filtered guests
  const countStatuses = () => {
    const arrivedCount = filteredGuests.filter((guest) => guest.status === 'Arrived').length;
    const pendingCount = filteredGuests.filter((guest) => guest.status === 'Pending').length;
    const totalCount = filteredGuests.length;
    return { arrivedCount, pendingCount, totalCount };
  };

  useEffect(() => {
    fetchGuests(); // Call function to fetch guest data
  }, []);

  const { arrivedCount, pendingCount, totalCount } = countStatuses();

  // Chart data
  const chartData = {
    labels: ['Arrived', 'Pending'],
    datasets: [
      {
        label: 'Guest Status Count',
        data: [arrivedCount, pendingCount],
        backgroundColor: ['#34D399', '#FBBF24'], // Green for arrived, Yellow for pending
        borderColor: ['#10B981', '#F59E0B'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Admin Dashboard</h1>

      <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-8">
        {/* Left side (Table) */}
        <div className="w-full sm:w-7/12 bg-white p-6 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Guest Attendance</h2>

          {/* Filter Dropdown */}
          <div className="mb-4">
            <label className="text-gray-800 font-semibold mr-4">Filter by Status: </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded-md bg-white"
            >
              <option value="All">All</option>
              <option value="Arrived">Arrived</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center text-lg">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-separate border-spacing-2">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-6 py-3 text-left text-gray-800">Barcode</th>
                    <th className="px-6 py-3 text-left text-gray-800">Name</th>
                    <th className="px-6 py-3 text-left text-gray-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50 transition duration-200">
                      <td className="px-6 py-4 text-gray-700">{guest.barcode}</td>
                      <td className="px-6 py-4 text-gray-700">{guest.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`${
                            guest.status === 'Arrived' ? 'text-green-600' : 'text-yellow-600'
                          } font-semibold`}
                        >
                          {guest.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right side (Statistics & Chart) */}
        <div className="w-full sm:w-5/12 bg-white p-6 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Guest Statistics</h2>
          
          {/* Statistics */}
          <div className="space-y-4">
            <div className="text-lg font-semibold text-gray-700">
              Arrived Count: <span className="text-green-600">{arrivedCount}</span>
            </div>
            <div className="text-lg font-semibold text-gray-700">
              Pending Count: <span className="text-yellow-600">{pendingCount}</span>
            </div>
            <div className="text-lg font-semibold text-gray-700">
              Total Count: <span className="text-blue-600">{totalCount}</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="mt-6">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: 'Guest Status Distribution' },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
