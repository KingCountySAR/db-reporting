'use client';
import { useApp } from "@/app/lib/appContext";

export default function Page() {
  const app = useApp();
  return (
    <>
      <h1 className="text-primary">Protected client Page</h1>
      <pre>{JSON.stringify(app.user ?? 'no user')}</pre>
    </>
  )
}
