'use client';

import React, { createContext, useContext } from 'react';
import { ClientUser } from '@/app/models/clientUser';

interface AppContextProps {
  user?: ClientUser,
	unitList: string[],
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({children, user, unitList }: { children: React.ReactNode, user?: ClientUser|undefined, unitList: string[] }) {
  return (
		<AppContext.Provider value={{ user, unitList }}>
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
