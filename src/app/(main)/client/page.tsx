'use client';
import { useApp } from "@/app/lib/appContext";
import { asClientPage } from "@/app/lib/asClientPage";

function Page() {
  const app = useApp();
  return (
    <>
      <h1>Protected client Page</h1>
      <pre>{JSON.stringify(app.user ?? 'no user')}</pre>
    </>
  )
}

export default asClientPage(Page);