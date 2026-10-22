import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import amplifyConfig, { appStage } from './config/amplifyConfig.js'
import { apiEndpoint, apiRegion } from './config/appEnv.js'
import './index.css'
import App from './App.jsx'

console.log("STAGE", appStage);
console.log("API", apiEndpoint, apiRegion);
console.log("USER_POOL", import.meta.env.VITE_USER_POOL_ID);
console.log("CLIENT_ID", import.meta.env.VITE_USER_POOL_CLIENT_ID);
console.log("IDENTITY_POOL", import.meta.env.VITE_IDENTITY_POOL_ID);
console.log("REGION", import.meta.env.VITE_AWS_REGION);
// Configure Amplify with the settings from amplifyConfig
Amplify.configure(amplifyConfig)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
