import React from 'react';
import { PresentationStage } from './components/PresentationStage';
import { MEMBERS } from './data/members';

export const App: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#4D0E12]">
      <PresentationStage members={MEMBERS} />
    </div>
  );
};

export default App;
