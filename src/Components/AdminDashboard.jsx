import { useState, useEffect } from "react";
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
      console.log("Fetching guests from the API...");
      const response = await fetch(
        "https://self-kiosk-backenddb.onrender.com/api/check-in"
      ); // Replace with your Render API URL

      if (response.ok) {
        const data = await response.json();
        console.log("Guests data fetched:", data);

        if (data && data.guests) {
          const guestsList = data.guests.map((guest) => ({
            id: guest.id,
            serialNumber: guest.serialNumber,
            barcode: guest.barcode,
            name: guest.name,
            organization: guest.organization || "N/A", // Default value for organization
            status: guest.status || "Pending", // Default status if not set
            arrivalTime: guest.arrivalTime,
          }));
          setGuests(guestsList); // Set the state with fetched guest data
        } else {
          console.log("No guests found.");
        }
      } else {
        // Log error response if not ok (e.g., 404 or 500)
        const errorText = await response.text();
        console.error("Failed to fetch guests. Response:", errorText); // Log the raw HTML error
      }
    } catch (error) {
      console.error("Error fetching guests:", error); // More detailed error logging
    }
    setLoading(false); // Stop loading when data is fetched or error occurs
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

  useEffect(() => {
    fetchGuests(); // Call function to fetch guest data
  }, []);

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

    // Function to print the table headers with black color
    const printHeaders = () => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Ensure header text is always black
      doc.text("Sr. No.", 2, yPosition); // Adjusted position for Serial Number
      doc.text("Name", 30, yPosition); // Adjusted position for Name
      doc.text("Organization", 80, yPosition); // Adjusted position for Organization
      doc.text("Status", 145, yPosition); // Status column on the right
      doc.text("Arrival Time", 170, yPosition); // Arrival Time column on the right
    };

    // Print headers for the first page
    printHeaders();

    // Update yPosition after header
    yPosition += lineHeight;

    // Table Data
    filteredGuests.forEach((guest) => {
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
      doc.text(guest.serialNumber.toString(), 5, yPosition); // Adjusted Serial Number position
      doc.text(guest.name, 18, yPosition); // Adjusted Name position
      doc.text(guest.organization, 80, yPosition); // Adjusted Organization position
      

      // Set color and text for the Status column
      if (guest.status === "Arrived") {
        doc.setTextColor(34, 211, 153); // Green color for 'Arrived'
      } else if (guest.status === "Pending") {
        doc.setTextColor(251, 191, 36); // Yellow color for 'Pending'
      } else {
        doc.setTextColor(0, 0, 0); // Default black color for other statuses
      }
      doc.text(guest.status, 145, yPosition); // Status column with color
      doc.text(guest.arrivalTime, 165, yPosition); // Arrival Time column

      // Move yPosition down for the next row
      yPosition += lineHeight;
    });

    // Save the PDF
    doc.save("guest_data.pdf");
  };

  return (
<div
  className="min-h-screen p-4 sm:p-8"
  style={{
    background: 'linear-gradient(#45277D, #45277D)',
  }}
>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
        Admin Dashboard
      </h1>

      <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-8">
        {/* Left side (Table) */}
        <div className="w-full  bg-transparent p-6 sm:p-8 rounded-lg shadow-lg  border-2 border-white backdrop-blur-md backdrop-brightness-75">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
            Guest Attendance
          </h2>

          {/* Filter & Download PDF Button */}
          <div className="flex flex-col sm:flex-row items-center mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center">
              <label className="text-white font-semibold mr-4">
                Filter by Status:{" "}
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="p-2 border  bg-gray-900 text-white"
              >
                <option value="All">All</option>
                <option value="Arrived">Arrived</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-gray-900 border border-white text-white  hover:bg-white hover:text-blue-700 transition duration-200"
            >
              Download PDF
            </button>
          </div>

          {loading ? (
            <div className="text-center text-lg text-white">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-separate border-spacing-2">
                <thead>
                  <tr className="bg-gray-900">
                    <th
                      onClick={() => requestSort("serialNumber")}
                      className="px-4 py-4 text-left text-white cursor-pointer"
                      style={{ width: "10%" }}
                    >
                      Serial Number
                      {sortConfig.key === "serialNumber"
                        ? sortConfig.direction === "asc"
                          ? " ↑"
                          : " ↓"
                        : null}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-white"
                      style={{ width: "15%" }}
                    >
                      Barcode
                    </th>
                    <th
                      className="px-6 py-4 text-left text-white"
                      style={{ width: "20%" }}
                    >
                      Name
                    </th>
                    <th
                      className="px-6 py-4 text-left text-white"
                      style={{ width: "30%" }}
                    >
                      Organization
                    </th>
                    <th
                      className="px-6 py-4 text-left text-white"
                      style={{ width: "15%" }}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-4 text-left text-white"
                      style={{ width: "20%" }}
                    >
                      Arrival Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr
                      key={guest.id}
                      className="hover:bg-gray-900 transition duration-200"
                    >
                      <td className="px-6 py-4 text-white">
                        {guest.serialNumber}
                      </td>
                      <td className="px-6 py-4 text-white">{guest.barcode}</td>
                      <td className="px-6 py-4 text-white">{guest.name}</td>
                      <td className="px-6 py-4 text-white">
                        {guest.organization}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`${
                            guest.status === "Arrived"
                              ? "text-green-300"
                              : "text-yellow-300"
                          } font-semibold`}
                        >
                          {guest.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">{guest.arrivalTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
