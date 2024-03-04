import { auth } from 'auth';
import { AppProvider } from './appContext';
import { ClientUser } from '@/app/models/clientUser';

export const asClientPage = <P extends object>(Component: React.ComponentType<P>) => (
  async (props: P) => {
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
      <AppProvider user={user}>
        <Component {...props} />
      </AppProvider>
    )
  }
);