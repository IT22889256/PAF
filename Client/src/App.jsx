// // src/App.js
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
// import HomePage from './pages/HomePage';
// import LoginPage from './pages/LoginPage';
// import ProfilePage from './pages/ProfilePage';
// import Navbar from './components/Navbar';
// import ProtectedRoute from './components/ProtectedRoute';

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Navbar />
//         <Routes>
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
//           <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
//           <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import PostsPage from './pages/PostsPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          {/* <Route path="/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} /> */}
          <Route path="/communities" element={<ProtectedRoute><div>Communities Page (Coming Soon)</div></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;