import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { useNavigate } from 'react-router-dom';
import { db, ref, get, update } from '../../../backend/firebase';

const GateScanner = () => {
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false); // State to control the login modal
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  // Handle barcode scan
  const handleScan = async (data) => {
    if (data) {
      const barcode = data.text;
      setScannedData(barcode);
      setLoading(true);
      setModalMessage('Processing...');

      try {
        const guestsRef = ref(db, 'Data'); // Reference to the 'Data' node in Firebase
        const snapshot = await get(guestsRef); // Fetch data from Firebase

        if (snapshot.exists()) {
          let foundGuest = null;
          let guestKey = null;

          snapshot.forEach((childSnapshot) => {
            const guest = childSnapshot.val();

            if (guest.barcode === barcode) {
              foundGuest = guest;
              guestKey = childSnapshot.key;
            }
          });

          if (foundGuest && guestKey) {
            await update(ref(db, `Data/${guestKey}`), { status: 'Arrived' });
            setModalMessage(`Access Granted. Welcome ${foundGuest.name}`);
          } else {
            setModalMessage("Barcode not found. Access Denied.");
          }
        } else {
          setModalMessage("No guests in the database.");
        }
      } catch (error) {
        console.error("Error verifying guest:", error);
        setModalMessage("Error verifying guest. Please try again.");
      } finally {
        setLoading(false);
        setShowScanner(false); // Close scanner after processing
      }
    }
  };

  // Handle errors during QR scan
  const handleError = (err) => {
    console.error("Error scanning barcode:", err);
    setModalMessage("Error scanning barcode. Please try again.");
  };

  // Open the scanner when the "Start Scan" button is clicked
  const startScan = () => {
    setShowScanner(true);
  };

  // Open the login modal when the "Admin Dashboard" button is clicked
  const openLoginModal = () => {
    setShowLoginModal(true);
  };

  // Close the login modal
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  // Handle login form submission
  const handleLogin = (e) => {
    e.preventDefault();

    if (username === 'gryphoncore' && password === '123') {
      localStorage.setItem('isLoggedIn', 'true');
      setShowLoginModal(false);
      navigate('/dashboard');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        {/* Company Logo */}
        <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-0 w-full sm:w-auto">
          <img src="NewLogo.png" alt="Company Logo" className="w-32 h-16 mr-4" />
        </div>

        {/* Admin Dashboard Button */}
        <button
          onClick={openLoginModal}
          className="bg-green-600 text-white py-2 px-6 rounded-lg text-xl shadow-lg hover:bg-green-500 transition duration-300"
        >
          Admin Dashboard
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className='text-4xl sm:text-5xl mb-6 text-white font-semibold'>Self Kiosk</p>
        <p className="text-lg text-white mb-6">Scan the guest&apos;s barcode for access</p>

        <button
          onClick={startScan}
          className="bg-white text-blue-600 py-2 px-6 rounded-lg text-xl font-semibold shadow-lg hover:bg-blue-50 transition duration-300"
        >
          Start Scan
        </button>
      </div>

      {/* QR Scanner */}
      {showScanner && (
        <div className="mt-6 max-w-full w-full mx-auto">
          <QrScanner
            delay={300}
            style={{
              width: '100%',
              maxWidth: '800px',
              height: '400px',
              margin: '0 auto',
              border: '2px solid #ddd',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0px 4px 15px rgba(0,0,0,0.1)',
            }}
            onScan={handleScan}
            onError={handleError}
          />
        </div>
      )}

      {/* Loading spinner */}
      {loading && <div className="mt-4 text-white">Processing...</div>}

      {/* Scanned barcode display */}
      {scannedData && (
        <p className="mt-4 text-lg text-white">{`Scanned Barcode: ${scannedData}`}</p>
      )}

      {/* Modal for login */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-8 w-full sm:w-96 text-center shadow-xl relative">
            {/* Close Button */}
            <button
              onClick={closeLoginModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-semibold text-center text-blue-600 mb-6">Admin Login</h2>

            {/* Login Form */}
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-gray-700">Username</label>
                <input
                  type="text"
                  id="username"
                  className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700">Password</label>
                <input
                  type="password"
                  id="password"
                  className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Error message */}
              {loginError && (
                <div className="mb-4 text-red-500 text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg hover:bg-blue-700 transition duration-300"
              >
                Log In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for messages */}
      {modalMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-8 w-96 text-center shadow-xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{modalMessage}</h3>
            <button
              onClick={() => setModalMessage("")}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateScanner;
