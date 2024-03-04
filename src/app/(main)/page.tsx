import { auth } from '@/auth';

export default async function MainPage() {
  const session = await auth();
  // if (status === "loading") {
  //   return <p>Loading...</p>
  // }

  // if (status === "unauthenticated") {
  //   return <p>Access Denied</p>
  // }
  return (
    <>
      <h1>Protected Page</h1>
      <pre>{JSON.stringify(session?.user)}</pre>
    </>
  )
}