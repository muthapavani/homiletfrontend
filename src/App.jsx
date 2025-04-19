import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/ladigpage.jsx";
import Login from "./loginsignup/login";
import Signup from "./loginsignup/signup";
import Dashboard from "./Dashboard/dash.jsx";
import PrivateRoute from "./loginsignup/private";
import ForgotPassword from "./loginsignup/forgotpass";
import ResetPassword from "./loginsignup/resetpass";

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <p>Loading...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<Landing />} />
          
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected dashboard route */}
          <Route 
            path="/dashboard/*" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Catch-all route for 404 pages */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;