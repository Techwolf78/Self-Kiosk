import { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';
import { useNavigate } from 'react-router-dom';

const GateScanner = () => {
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [timer, setTimer] = useState(null); // Timer state to track inactivity
  const [isScanning, setIsScanning] = useState(false); // Track scanning state
  const navigate = useNavigate();

  // Function to speak the message once and close the modal after 1 second
  const speakMessageOnce = (message) => {
    if (!window.speechSynthesis.speaking) {
      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'en-IN';
      speech.pitch = 1;
      speech.rate = 1;
      speech.volume = 1;
  
      speech.onend = () => {
        setTimeout(() => {
          setModalMessage("");  // Clears the message after 200ms
          // Open scanner automatically after another 2000ms
          setTimeout(() => {
            startScan(); // Open the scanner automatically
          }, 300); // Delay of 2000ms (2 seconds)
        }, 200); // Clears modalMessage after 200ms
      };
  
      window.speechSynthesis.speak(speech);
    }
  };
  
  const handleScan = async (data) => {
    if (data && !isScanning) {  // Only process if not already scanning
      const barcode = data.text;
      setScannedData(barcode);
      setIsScanning(true); // Set scanning state to true
      setLoading(true);
      setModalMessage('Processing...');
  
      try {
        const response = await fetch('https://self-kiosk-backenddb.onrender.com/api/check-in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ barcode }),  
        });
  
        const result = await response.json();
  
        if (result.status === 'found') {
          const welcomeMessage = `Welcome ${result.name}`;
          setModalMessage(welcomeMessage);
          speakMessageOnce(`Welcome to Synergy Sphere ${result.name}`);
        } else {
          setModalMessage("Barcode not found. Access Denied.");
        }
      } catch (error) {
        console.error("Error verifying guest:", error);
        setModalMessage("Error verifying guest. Please try again.");
      } finally {
        setLoading(false);
        setShowScanner(false); // Close scanner after processing
        setIsScanning(false); // Reset scanning state
      }
    }
  };
  

  const handleError = (err) => {
    console.error("Error scanning barcode:", err);
    setModalMessage("Error scanning barcode. Please try again.");
  };

  const startScan = () => {
    setShowScanner(true);
    // Reset timer when scanner starts
    resetScannerTimer();
  };

  const stopScan = () => {
    setShowScanner(false);
    clearTimeout(timer); // Clear timer when manually closing
    setIsScanning(false); // Reset scanning state when manually closed
  };

  // Function to reset the inactivity timer
  const resetScannerTimer = () => {
    // Clear the existing timer, if any
    if (timer) clearTimeout(timer);

    // Set a new timer for inactivity (5 minutes = 300000ms)
    const newTimer = setTimeout(() => {
      setModalMessage("Scanner closed due to inactivity.");
      setShowScanner(false); // Automatically close scanner after 5 minutes
    }, 300000); // 5 minutes
    setTimer(newTimer); // Store the timer
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

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
    <div className="min-h-screen bg-cover bg-center p-2 md:p-4 relative" style={{ backgroundImage: "url('sky.jpg')" }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-30 z-0"></div>
  
      <div className="flex flex-col items-center justify-between mb-2 z-10 relative">
        <div className="flex items-center justify-center sm:mb-0 w-full sm:w-auto">
          <img src="NewLogo.png" alt="Company Logo" className="w-36 h-18" />
        </div>
      </div>

      <div className="text-center z-10 relative">
        <h1 className="text-white text-4xl md:text-5xl font-bold text-center mb-3">Synergy Sphere 2024</h1>
        <p className="text-white text-3xl md:text-4xl font-light mb-6 cookie-regular">Unison of Industry & Academia</p>
  
        <div className="mb-2 flex justify-center w-auto h-48">
          <img src="logo.png" alt="Banner" className="object-contain rounded-lg shadow-lg"/>
        </div>

        <p className="text-2xl md:text-3xl mb-6 text-white font-bold tracking-tight">Self Kiosk</p>

        <button
          onClick={startScan}
          className="bg-transparent border-2 border-white text-white py-1 md:py-2 px-2 md:px-8 text-base md:text-lg font-semibold shadow-none hover:bg-white hover:text-blue-700 transition duration-300 transform hover:scale-105"
        >
          SCAN
        </button>
        <br />
        <div className="mt-6 flex justify-center">
          <button
            onClick={openLoginModal}
            className="bg-transparent border-2 border-white text-white py-1 md:py-3 px-2 md:px-8 text-base md:text-lg font-semibold shadow-none hover:bg-white hover:text-blue-700 transition duration-300 transform hover:scale-105 sm:hidden block"
          >
            Admin Dashboard
          </button>
        </div>

        {showScanner && (
          <div className="mt-8 max-w-full w-full mx-auto">
            <QrScanner
              delay={300}
              style={{
                width: '100%',
                maxWidth: '800px',
                height: '400px',
                margin: '0 auto',
                border: '2px solid #ddd',
                borderRadius: '15px',
                padding: '20px',
                boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
              }}
              onScan={handleScan}
              onError={handleError}
            />
            <button
              onClick={stopScan}
              className="bg-transparent border-2 border-white text-white py-1 md:py-3 px-2 md:px-8 mt-4 text-base md:text-lg font-semibold shadow-none hover:bg-white hover:text-blue-700 transition duration-300 transform hover:scale-105"
            >
              Close Scanner
            </button>
          </div>
        )}
      </div>

      {loading && <div className="mt-4 text-white">Processing...</div>}

      {showLoginModal && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-transparent border-2 border-white p-8 w-full sm:w-96 text-center shadow-xl rounded-lg relative backdrop-blur-md backdrop-brightness-75">
            <button
              onClick={closeLoginModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-3xl font-semibold text-white mb-6">Admin Login</h2>

            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label htmlFor="username" className="block text-white">Username</label>
                <input
                  type="text"
                  id="username"
                  className="w-full p-4 mt-2 border-2 border-white bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-white">Password</label>
                <input
                  type="password"
                  id="password"
                  className="w-full p-4 mt-2 border-2 border-white bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {loginError && (
                <div className="mb-4 text-red-500 text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-transparent border-2 border-white text-white py-3 text-lg hover:bg-white hover:text-blue-600 transition duration-300"
              >
                Log In
              </button>
            </form>
          </div>
        </div>
      )}

      {modalMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-transparent p-8 text-center shadow-xl border-2 border-white text-white backdrop-blur-md backdrop-brightness-75">
            <p className="text-xl font-semibold">{modalMessage}</p>
            <button
              onClick={() => setModalMessage("")}
              className="mt-2 bg-transparent border-2 border-white text-white py-2 px-8 rounded-xl transition duration-300 hover:bg-blue-700"
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
