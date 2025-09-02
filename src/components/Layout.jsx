import { Info } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

export default function Layout({ children }) {
  const hash = useLocation();

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between py-2 px-4 h-14 bg-gray-50 shadow">
        <h1 className="text-xl">Graphics</h1>
        <div className="flex gap-4">
          <a
            className={`hover:bg-gray-200 px-2 py-1 rounded transition ${
              hash === 'demos' ? 'bg-gray-200' : ''
            }`}
            href="#demos"
          >
            Demos
          </a>
          <a
            className={`hover:bg-gray-200 px-2 py-1 rounded transition ${
              hash === 'shader' ? 'bg-gray-200' : ''
            }`}
            href="#shader"
          >
            Shader
          </a>
        </div>
        <div>
          <Info />
        </div>
      </div>
      <div className="flex p-2">{children}</div>
    </div>
  );
}
