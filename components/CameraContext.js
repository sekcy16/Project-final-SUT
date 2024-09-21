import React, { createContext, useContext, useState } from 'react';

const CameraContext = createContext();

export const CameraProvider = ({ children }) => {
  const [isCameraReady, setIsCameraReady] = useState(false);

  const resetCamera = () => {
    setIsCameraReady(false);
  };

  return (
    <CameraContext.Provider value={{ isCameraReady, setIsCameraReady, resetCamera }}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCameraContext = () => useContext(CameraContext);