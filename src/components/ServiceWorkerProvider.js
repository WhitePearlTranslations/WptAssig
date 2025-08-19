import React from 'react';

// Service Worker deshabilitado - componente simplificado
const ServiceWorkerProvider = ({ children }) => {
  console.log('ServiceWorkerProvider deshabilitado - sin service worker');
  
  return children;
};

export default ServiceWorkerProvider;
