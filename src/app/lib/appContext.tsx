'use client';

import React, { createContext, useContext } from 'react';
import { ClientUser } from '@/app/models/clientUser';

interface AppContextProps {
  user?: ClientUser
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({children, user }: { children: React.ReactNode, user?: ClientUser|undefined }) {
  return (
		<AppContext.Provider value={{ user }}>
			{children}
		</AppContext.Provider>
	);
}

export const useApp = (): AppContextProps => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useApp must be used within AppProvider');
	}
	return context;
};
