import '@/app/ui/global.css';

import { auth } from 'auth';
import { AppProvider } from '@/app/lib/appContext';
import { ClientUser } from '@/app/models/clientUser';

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const session = await auth();
  let user: ClientUser|undefined = undefined;
  if (session?.user) {
    user = {
      id: session?.user.id!,
      name: session?.user.name,
      email: session?.user.email,
    };
  }

  return (
    <html lang="en">
      <body>
        <AppProvider user={user}>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
