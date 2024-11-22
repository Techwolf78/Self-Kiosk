import { useState } from 'react';
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
  const navigate = useNavigate();

  const speakMessageOnce = (message) => {
    if (!window.speechSynthesis.speaking) {
      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'en-IN';
      speech.pitch = 1;
      speech.rate = 0.7;
      speech.volume = 1;

      speech.onend = () => {
        setTimeout(() => {
          setModalMessage(""); 
        }, 200);
      };

      window.speechSynthesis.speak(speech);
    }
  };

  const handleScan = async (data) => {
    if (data) {
      const barcode = data.text;
      setScannedData(barcode);
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

        if (response.ok) {
          if (result.status === 'found') {
            const welcomeMessage = `Welcome ${result.name}`;
            setModalMessage(welcomeMessage);
            speakMessageOnce(`Welcome to Synergy Sphere ${result.name}`);
          } else {
            setModalMessage("Barcode not found. Access Denied.");
          }
        } else {
          setModalMessage("Error: Unable to verify the barcode.");
        }
      } catch (error) {
        console.error("Error verifying guest:", error);
        setModalMessage("Error verifying guest. Please try again.");
      } finally {
        setLoading(false);
        setShowScanner(false);
      }
    }
  };

  const handleError = (err) => {
    console.error("Error scanning barcode:", err);
    setModalMessage("Error scanning barcode. Please try again.");
  };

  const startScan = () => {
    setShowScanner(true);
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
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-0 w-full sm:w-auto">
          <img src="NewLogo.png" alt="Company Logo" className="w-32 h-16 mr-4" />
        </div>

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

      {loading && <div className="mt-4 text-white">Processing...</div>}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-8 w-full sm:w-96 text-center shadow-xl relative">
            <button
              onClick={closeLoginModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-semibold text-center text-blue-600 mb-6">Admin Login</h2>

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

      {modalMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg text-center shadow-xl">
            <p className="text-xl font-semibold">{modalMessage}</p>
            <button
              onClick={() => setModalMessage("")}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg"
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
