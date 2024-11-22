import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2"; // Importing chart.js to display a visual diagram
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { jsPDF } from "jspdf"; // Import jsPDF for generating PDF

// Register necessary chart elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All"); // Default filter is 'All'
  const [sortConfig, setSortConfig] = useState({
    key: "serialNumber",
    direction: "asc",
  }); // State for sorting

  // Fetch guest data from your backend API (deployed on Render)
  const fetchGuests = async () => {
    try {
      const response = await fetch("https://your-backend-url/render/api/guests"); // Replace with your Render API URL
      const data = await response.json();

      if (data && data.guests) {
        const guestsList = data.guests.map((guest) => ({
          id: guest.id,
          serialNumber: guest.serialNumber,
          barcode: guest.barcode,
          name: guest.name,
          organization: guest.organization || "N/A", // Default value for organization
          status: guest.status || "Pending", // Default status if not set
        }));
        setGuests(guestsList); // Set the state with fetched guest data
      } else {
        console.log("No guests found.");
      }
    } catch (error) {
      console.error("Error fetching guests:", error);
    }
    setLoading(false); // Stop loading when data is fetched
  };

  // Sorting function to sort guests based on the selected column and direction
  const sortedGuests = () => {
    const sortedData = [...guests];

    sortedData.sort((a, b) => {
      const numA = parseInt(a.serialNumber, 10);
      const numB = parseInt(b.serialNumber, 10);

      if (numA < numB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (numA > numB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sortedData;
  };

  // Toggle sort direction when the column header is clicked
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter the guests based on the selected filter
  const filteredGuests = sortedGuests().filter((guest) => {
    if (filter === "All") return true;
    return guest.status === filter;
  });

  // Count the different statuses for filtered guests
  const countStatuses = () => {
    const arrivedCount = filteredGuests.filter(
      (guest) => guest.status === "Arrived"
    ).length;
    const pendingCount = filteredGuests.filter(
      (guest) => guest.status === "Pending"
    ).length;
    const totalCount = filteredGuests.length;
    return { arrivedCount, pendingCount, totalCount };
  };

  useEffect(() => {
    fetchGuests(); // Call function to fetch guest data
  }, []);

  const { arrivedCount, pendingCount, totalCount } = countStatuses();

  // Chart data
  const chartData = {
    labels: ["Arrived", "Pending"],
    datasets: [
      {
        label: "Guest Status Count",
        data: [arrivedCount, pendingCount],
        backgroundColor: ["#34D399", "#FBBF24"], // Green for arrived, Yellow for pending
        borderColor: ["#10B981", "#F59E0B"],
        borderWidth: 1,
      },
    ],
  };

  // Function to export guest data to PDF
  const downloadPDF = () => {
    const doc = new jsPDF();

    // Set title and styling
    doc.setFontSize(20);
    doc.text("Guest Attendance Report", 14, 22);

    // Table Data
    let yPosition = 50;
    const lineHeight = 10; // Height of each row
    const maxY = 290; // Max Y position before needing a page break
    const headerPrinted = false; // Flag to track if headers are printed

    // Function to print the table headers with black color
    const printHeaders = () => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Ensure header text is always black
      doc.text("Serial Number", 14, yPosition); // Adjusted position for Serial Number
      doc.text("Name", 50, yPosition); // Adjusted position for Name
      doc.text("Organization", 110, yPosition); // Adjusted position for Organization
      doc.text("Status", 180, yPosition); // Status column on the right
    };

    // Print headers for the first page
    printHeaders();

    // Update yPosition after header
    yPosition += lineHeight;

    // Table Data
    filteredGuests.forEach((guest, index) => {
      // Check if the content exceeds the page limit
      if (yPosition + lineHeight > maxY) {
        doc.addPage(); // Add a new page
        yPosition = 20; // Reset yPosition for the new page

        // Only print headers on the first page
        printHeaders();
        yPosition += lineHeight; // Add space after headers
      }

      // Add guest data with adjusted column widths
      doc.setTextColor(0, 0, 0); // Default color (black) for all text except status
      doc.text(guest.serialNumber.toString(), 14, yPosition); // Adjusted Serial Number position
      doc.text(guest.name, 50, yPosition); // Adjusted Name position
      doc.text(guest.organization, 110, yPosition); // Adjusted Organization position

      // Set color and text for the Status column
      if (guest.status === "Arrived") {
        doc.setTextColor(34, 211, 153); // Green color for 'Arrived'
      } else if (guest.status === "Pending") {
        doc.setTextColor(251, 191, 36); // Yellow color for 'Pending'
      } else {
        doc.setTextColor(0, 0, 0); // Default black color for other statuses
      }
      doc.text(guest.status, 180, yPosition); // Status column with color

      // Move yPosition down for the next row
      yPosition += lineHeight;
    });

    // Save the PDF
    doc.save("guest_data.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
        Admin Dashboard
      </h1>

      <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-8">
        {/* Left side (Table) */}
        <div className="w-full sm:w-7/12 bg-white p-6 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
            Guest Attendance
          </h2>

          {/* Filter & Download PDF Button */}
          <div className="flex flex-col sm:flex-row items-center mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center">
              <label className="text-gray-800 font-semibold mr-4">
                Filter by Status:{" "}
              </label>
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

            <button
              onClick={downloadPDF}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600"
            >
              Download PDF
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-center text-lg">Loading...</p>
          ) : (
            <table className="min-w-full table-auto border-separate border-spacing-2">
              <thead>
                <tr className="bg-gray-200">
                  <th
                    onClick={() => requestSort("serialNumber")}
                    className="px-4 py-4 text-left text-gray-800 cursor-pointer"
                  >
                    Serial Number
                    {sortConfig.key === "serialNumber" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </th>
                  <th
                    onClick={() => requestSort("barcode")}
                    className="px-6 py-4 text-left text-gray-800 cursor-pointer"
                  >
                    Barcode
                  </th>
                  <th
                    onClick={() => requestSort("name")}
                    className="px-6 py-4 text-left text-gray-800 cursor-pointer"
                  >
                    Name
                    {sortConfig.key === "name" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </th>
                  <th
                    onClick={() => requestSort("organization")}
                    className="px-6 py-4 text-left text-gray-800 cursor-pointer"
                  >
                    Organization
                  </th>
                  <th
                    onClick={() => requestSort("status")}
                    className="px-6 py-4 text-left text-gray-800 cursor-pointer"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50 transition duration-200">
                    <td className="px-6 py-4 text-gray-700">{guest.serialNumber}</td>
                    <td className="px-6 py-4 text-gray-700">{guest.barcode}</td>
                    <td className="px-6 py-4 text-gray-700">{guest.name}</td>
                    <td className="px-6 py-4 text-gray-700">{guest.organization}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`${
                          guest.status === "Arrived" ? "text-green-600" : "text-yellow-600"
                        } font-semibold`}
                      >
                        {guest.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right side (Chart) */}
        <div className="w-full sm:w-5/12 bg-white p-6 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
            Guest Status Breakdown
          </h2>
          <div className="max-w-full">
            <Bar data={chartData} options={{ responsive: true }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
