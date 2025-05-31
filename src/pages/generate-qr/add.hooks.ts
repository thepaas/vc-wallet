import { useEffect, useState } from 'react';

const DIGITAL_IDS_KEY = 'DIGITAL_IDS';

type DigitalId = { claimsInput: string; jwt: string };

export const useDigitalIds = () => {
  const [digitalIds, setDigitalIds] = useState<DigitalId[]>([]);

  const addDigitalId = (digitalId: { claimsInput: string; jwt: string }) => {
    const digitalIdsStorageItem = JSON.parse(
      localStorage.getItem(DIGITAL_IDS_KEY) ?? '[]'
    );

    const digitalIds = [...digitalIdsStorageItem, digitalId];
    localStorage.setItem(DIGITAL_IDS_KEY, JSON.stringify(digitalIds));
    setDigitalIds((p) => [...p, digitalId]);
  };

  useEffect(() => {
    const digitalIds = JSON.parse(
      localStorage.getItem(DIGITAL_IDS_KEY) ?? '[]'
    );

    if (!digitalIds.length) return;

    setDigitalIds(digitalIds);
  }, []);

  return {
    digitalIds,
    addDigitalId,
  };
};
