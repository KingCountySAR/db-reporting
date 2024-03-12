import { CenturyClubRow } from "@/app/lib/data";

export interface CenturyClubApiResult extends Omit<CenturyClubRow, 'first'|'time'> {
  first: string;
  time: string|undefined;
}

export function parseCenturyClubApiResult(result: CenturyClubApiResult[]): CenturyClubRow[] {
  return result.map(row => ({
    ...row,
    time: row.time ? new Date(row.time) : undefined,
    first: new Date(row.first),
  }));
}