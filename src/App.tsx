import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { Tools } from '@/pages/Tools';
import { Reserve } from '@/pages/Reserve';
import { Records } from '@/pages/Records';
import { Profile } from '@/pages/Profile';
import { initializeData } from '@/utils/storage';

export default function App() {
  useEffect(() => {
    initializeData();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/reserve/:toolId" element={<Reserve />} />
          <Route path="/records" element={<Records />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
}
