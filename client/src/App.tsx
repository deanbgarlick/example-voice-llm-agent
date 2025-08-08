import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import VoiceGroceryDelivery from './pages/VoiceGroceryDelivery'
import { ThemeProvider } from './components/theme-provider'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<VoiceGroceryDelivery />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App