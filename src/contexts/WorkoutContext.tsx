import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface WorkoutContextType {
  isGuidedWorkoutActive: boolean;
  setIsGuidedWorkoutActive: (active: boolean) => void;
  shouldRefreshHome: boolean;
  triggerHomeRefresh: () => void;
  clearHomeRefresh: () => void;
  shouldRefreshCommunity: boolean;
  triggerCommunityRefresh: () => void;
  clearCommunityRefresh: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isGuidedWorkoutActive, setIsGuidedWorkoutActive] = useState(false);
  const [shouldRefreshHome, setShouldRefreshHome] = useState(false);
  const [shouldRefreshCommunity, setShouldRefreshCommunity] = useState(false);

  const triggerHomeRefresh = useCallback(() => {
    setShouldRefreshHome(true);
  }, []);

  const clearHomeRefresh = useCallback(() => {
    setShouldRefreshHome(false);
  }, []);

  const triggerCommunityRefresh = useCallback(() => {
    setShouldRefreshCommunity(true);
  }, []);

  const clearCommunityRefresh = useCallback(() => {
    setShouldRefreshCommunity(false);
  }, []);

  return (
    <WorkoutContext.Provider value={{
      isGuidedWorkoutActive,
      setIsGuidedWorkoutActive,
      shouldRefreshHome,
      triggerHomeRefresh,
      clearHomeRefresh,
      shouldRefreshCommunity,
      triggerCommunityRefresh,
      clearCommunityRefresh,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within WorkoutProvider');
  }
  return context;
};
