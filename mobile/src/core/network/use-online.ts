import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** `true` unless the OS reports no internet reachability. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
  }, []);

  return online;
}
