import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QrScanner from 'react-qr-scanner';

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
  const [stream, setStream] = useState(null);  // Store the media stream
  const [cameras, setCameras] = useState([]); // List of available cameras
  const [selectedCamera, setSelectedCamera] = useState(null); // Selected camera device ID
  const videoRef = useRef(null);  // Ref for the video element
  const navigate = useNavigate();

  const predefinedGuests = [
    { barcode: '1234567890', name: 'Mr Suvarnanidhi Rao' },
    { barcode: '3456789012', name: 'Mr Ramchandra Honap' }
  ];

  const handleScan = async (data) => {
    if (data && !isScanning) {
      const barcode = data.text.trim();
      console.log('Scanned Barcode:', barcode);
      setScannedData(barcode);
      setIsScanning(true);
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
        console.log('Backend result:', result);

        if (result.status === 'found') {
          const welcomeMessage = `Welcome ${result.name}`;
          setModalMessage(welcomeMessage);
          speakMessageOnce(`Welcome to Synergy Sphere ${result.name}`);

          const date = new Date();
          const options = { timeZone: 'Asia/Kolkata', hour12: false };
          const arrivalTime = date.toLocaleString('en-IN', options);

          toast.success(`Welcome ${result.name}, Arrived at ${arrivalTime}`, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: true,
          });

        } else {
          const guest = predefinedGuests.find(g => g.barcode.trim() === barcode.trim());
          if (guest) {
            const welcomeMessage = `Welcome ${guest.name}`;
            setModalMessage(welcomeMessage);
            speakMessageOnce(`Welcome to Synergy Sphere ${guest.name}`);

            const date = new Date();
            const options = { timeZone: 'Asia/Kolkata', hour12: false };
            const arrivalTime = date.toLocaleString('en-IN', options);

            toast.success(`Welcome ${guest.name}, Arrived at ${arrivalTime}`, {
              position: 'top-right',
              autoClose: 5000,
              hideProgressBar: true,
            });

          } else {
            setModalMessage("Barcode not found. Contact Admin.");
          }
        }

      } catch (error) {
        console.error("Error verifying guest:", error);
        setModalMessage("Error verifying guest. Please try again.");
      } finally {
        setLoading(false);
        setShowScanner(false);
        setIsScanning(false);
      }
    }
  };

  const handleError = (err) => {
    console.error("Error scanning barcode:", err);
    setModalMessage("Error scanning barcode. Please try again.");
  };

  const startScan = () => {
    setShowScanner(true);
    resetScannerTimer();
  };

  const stopScan = () => {
    setShowScanner(false);
    clearTimeout(timer);
    setIsScanning(false);
  };

  const resetScannerTimer = () => {
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      setModalMessage("Scanner closed due to inactivity.");
      setShowScanner(false);
    }, 300000);
    setTimer(newTimer);
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

  useEffect(() => {
    if (showScanner) {
      initializeCamera(selectedCamera || camera); // Initialize the selected or default camera
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [showScanner, selectedCamera]);

  const initializeCamera = async (deviceId) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined },
      });

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      setStream(newStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setModalMessage("Error accessing camera.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const fetchCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId); // Default to the first camera
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  return (
    <div className="min-h-screen bg-cover bg-center p-2 md:p-4 relative" style={{ backgroundImage: "url('sky.avif')" }}>
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
          <img src="logo.png" alt="Banner" className="object-contain rounded-lg shadow-lg" />
        </div>

        <button
          onClick={startScan}
          className="bg-transparent border-2 border-white text-white p-1 px-8 text-base md:text-lg font-semibold shadow-none hover:bg-white hover:text-blue-700 transition duration-300 transform hover:scale-105 mx-4 my-1"
        >
          SCAN
        </button>

        {/* Dropdown for Camera Selection */}
        <div className="mt-4">
        <select
  onChange={(e) => setSelectedCamera(e.target.value)}
  value={selectedCamera || ""} // Fallback to empty string if selectedCamera is null
  className="bg-transparent border-2 border-white text-white py-2 px-4 text-lg font-semibold"
>
  {cameras.map(camera => (
    <option key={camera.deviceId} value={camera.deviceId}>
      {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
    </option>
  ))}
</select>

        </div>

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
          <div className="max-w-full w-full mx-auto">
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

      <ToastContainer /> {/* Add this to render the toast notifications */}
    </div>
  );
};

export default GateScanner;
