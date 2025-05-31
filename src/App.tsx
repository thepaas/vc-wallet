import { BrowserRouter, Routes, Route } from 'react-router-dom';

// pages
import GenerateQr from '@pages/generate-qr';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<GenerateQr />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
