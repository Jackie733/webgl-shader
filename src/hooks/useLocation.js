import { useState, useEffect } from 'react';

export function useLocation() {
  const getHash = () => {
    return window.location.hash.replace('#', '');
  };

  const [hash, setHash] = useState(getHash());

  useEffect(() => {
    const onHashChange = () => {
      setHash(getHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  return hash;
}
