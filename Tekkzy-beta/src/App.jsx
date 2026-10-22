import React from 'react'
import Routing from './routing.jsx';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { ApiProvider } from './context/ApiContext';


const App = () => {
  return (
    <AuthProvider>
      <ApiProvider>
        <Routing />
      </ApiProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  )
}

export default App;
