import './App.css';
import Layout from '@/components/Layout';
import Demos from '@/components/Demos';
import Shader from '@/components/Shader';
import { useLocation } from '@/hooks/useLocation';

function App() {
  const hash = useLocation();
  return <Layout>{hash === 'shader' ? <Shader /> : <Demos />}</Layout>;
}

export default App;
