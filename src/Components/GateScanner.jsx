import { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/* global responsiveVoice */
const GateScanner = () => {
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [timer, setTimer] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [camera, setCamera] = useState('environment');  // Track camera type ('environment' for back, 'user' for front)
  const navigate = useNavigate();

  // Function to speak the message once and close the modal after 1 second
  const speakMessageOnce = (message) => {
    if (typeof responsiveVoice !== "undefined") {
      // Replace abbreviations with their full forms for better pronunciation
      const correctedMessage = message
        .replace(/\bMs\.\b/g, "Miss")
        .replace(/\bMr\.\b/g, "Mister");
  
      const voices = [
        { lang: "US English Male", voice: "US English Male" },
        { lang: "UK English", voice: "UK English Female" },
        { lang: "US Hindi Male", voice: "Hindi Male" },
      ];
  
      // Try each voice in the array until one works
      let voiceUsed = false;
      for (let i = 0; i < voices.length; i++) {
        if (responsiveVoice.isPlaying() || !voiceUsed) {
          responsiveVoice.speak(correctedMessage, voices[i].lang, {
            pitch: 1,
            rate: 1,
            volume: 1,
          });
  
          // Check if the voice is available by listening to the end event
          responsiveVoice.onend = () => {
            voiceUsed = true;
            setTimeout(() => {
              setModalMessage(""); // Clears the message after 200ms
              setTimeout(() => {
                window.location.reload(); // Reload the page after audio completes
              }, 300); // Delay of 300ms (0.3 seconds)
            }, 200); // Clears modalMessage after 200ms
          };
  
          break; // Exit the loop after successfully speaking the message
        }
      }
    }
  };
  

  const handleScan = async (data) => {
    if (data && !isScanning) {  // Only process if not already scanning
      const barcode = data.text.trim();  // Trim any extra spaces from the scanned barcode
      console.log('Scanned Barcode:', barcode);  // This prints the barcode to the console
  
      setScannedData(barcode);
      setIsScanning(true); // Set scanning state to true
      setLoading(true);
      setModalMessage('Processing...');
    
      try {
        // Fetch the scanned barcode from the backend for validation
        const response = await fetch('https://self-kiosk-backenddb.onrender.com/api/check-in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ barcode }),
        });
    
        const result = await response.json();
        console.log('Backend result:', result);  // Check what response is coming from backend
    
        if (result.status === 'found') {
          const welcomeMessage = `Welcome ${result.name}`;
          setModalMessage(welcomeMessage);
          speakMessageOnce(`Welcome to Synergy Sphere ${result.name}`);
    
          // Get current time in IST
          const date = new Date();
          const options = { timeZone: 'Asia/Kolkata', hour12: false };
          const arrivalTime = date.toLocaleString('en-IN', options);
    
          // Show toast notification with name and arrival time
          toast.success(`Welcome ${result.name}, Arrived at ${arrivalTime}`, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: true,
          });
    
        } else {
          // Updated message here for "not found" scenario
          const notFoundMessage = "WELCOME TO SYNERGY SPHERE 2024";
          setModalMessage(notFoundMessage);
          speakMessageOnce(notFoundMessage);  // Speak the message for not found case
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
        <p className="text-white text-3xl md:text-4xl font-light mb-6 cookie-regular">&quot;Unison of Industry & Academia&quot;</p>

        <div className="mb-2 flex justify-center w-auto h-48">
          <img src="logo.png" alt="Banner" className="object-contain rounded-lg shadow-lg"/>
        </div>

        <button
            onClick={startScan}
            className="bg-transparent border-2 border-white text-white p-1 px-8 text-base md:text-lg font-semibold shadow-none hover:bg-white hover:text-blue-700 transition duration-300 transform hover:scale-105 mx-4 my-1"
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
          <div className=" max-w-full w-full mx-auto">
            <QrScanner
              delay={300}
              facingMode={camera} // Pass the camera state to the QrScanner component
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
      <p className="text-xl font-semibold mb-4">{modalMessage}</p> {/* Added margin-bottom */}
      <button
        onClick={() => setModalMessage("")}
        className="mt-4 bg-transparent border-2 border-white text-white py-2 px-8 rounded-xl transition duration-300 hover:bg-blue-700"
      >
        Close
      </button>
    </div>
  </div>
)}


      <ToastContainer /> {/* Add this to render the toast notifications */}
    </div>
  );
};

export default GateScanner;