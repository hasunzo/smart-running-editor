import React from 'react';
import { RunningImageComposer } from './components/RunningImageComposer';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <>
      <RunningImageComposer />
      <Toaster />
    </>
  );
}