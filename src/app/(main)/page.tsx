import { getMissionStats } from '@/app/lib/data';

export async function generateMetadata() {
  return {
    title: 'KCSARA Data Reports'
  };
}

export default async function MainPage() {
  const format = new Intl.NumberFormat();
  const missionStats = await getMissionStats();

  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center text-center gap-6 max-w-xl">
        <h1 className="text-5xl font-bold">Mission Response</h1>

        <span className="">
          In the last year, King County Search and Rescue has contributed to our community:
        </span>

        <div className="flex gap-8">
          <div className="stats shadow border-4 border-secondary">
            <div className="stat place-items-center">
              <div className="stat-title">Missions</div>
              <div className="stat-value">{missionStats.count}</div>
            </div>
          </div>
          <div className="stats shadow border-4 border-secondary">
            <div className="stat place-items-center border-3">
              <div className="stat-title">Volunteers</div>
              <div className="stat-value">{format.format(Math.round(missionStats.responders))}</div>
            </div>
          </div>
          <div className="stats shadow border-4 border-secondary">
            <div className="stat place-items-center">
              <div className="stat-title">Hours</div>
              <div className="stat-value">{format.format(Math.round(missionStats.hours))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}