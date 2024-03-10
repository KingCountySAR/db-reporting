import clientPromise from '../mongodb';
import { MissionDoc } from './mongoDocs';

interface MemberNameAndId {
  memberId: string;
  firstName: string;
  lastName?: string;
  refNumber?: string;
}

type TopVolunteerOptions = { start?: Date, end?: Date, unit?: string, filterInTown?: boolean, sortByHours?: boolean };
interface TopVolunteer {
  _id: string;
  count: number;
  hours: number;
  miles: number;
  firstName: string;
  lastName: string;
  refNumber?: string;
}

interface CenturyClubOptions { start?: Date, end?: Date, unit?: string, sort?: 'count' | 'time' | 'first' };
interface CenturyClubRow {
  _id: MemberNameAndId;
  first: Date;
  time: Date;
  count: number;
}

function getYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date;
}

export async function getCenturyClub(n: number = 100, options?: CenturyClubOptions) {
  let { start = getYearAgo(), end = new Date(), unit, sort = 'count' } = options ?? {};
  const client = await clientPromise;

  const pipeline = [
    { $unwind: { path: "$roster" } },
    // We only want to count missions where people were signed in with the specified unit.
    { $match: { "roster.timeline.unit": unit } },
    // Group by member, figuring out their first N missions, and keeping track of their total number of missions with the unit.
    {
      $group: {
        _id: {
          memberId: "$roster.memberId",
          refNumber: "$roster.refNumber",
          lastName: "$roster.lastName",
          firstName: "$roster.firstName",
        },
        missionStarts: {
          $topN: {
            n,
            sortBy: { start: 1, },
            output: {
              start: "$start",
              units: "$roster.timeline.unit",
            }
          }
        },
        totalCount: { $sum: 1 },
      },
    },
    // Turn document with arrays into array of documents
    { $unwind: { path: "$missionStarts" } },
    // Re-group by member, figuring out the first and last date in the set of N missions
    {
      $group: {
        _id: "$_id",
        first: { $min: "$missionStarts.start" },
        time: { $max: "$missionStarts.start" },
        count: { $max: "$totalCount" }, // Every row in the group should have same value for $totalCount
      },
    },
    { $match: { "count": { $gte: 100 } } },
    { $sort: { count: -1, time: 1 } },
  ];
  const cursor = await client.db().collection<MissionDoc>("missions").aggregate<CenturyClubRow>(pipeline);

  return (await cursor.toArray());
}

export async function getTopVolunteers(options?: TopVolunteerOptions) {
  const { start = getYearAgo(), end = new Date(), unit, filterInTown = false, sortByHours = false } = options ?? {};
  const client = await clientPromise;

  const filterParts = [];
  if (unit) filterParts.push({ 'roster.timeline.unit': unit });
  if (filterInTown) filterParts.push({ $nor: [{ 'roster.timeline.role': 'InTown' }] });
  const filter = filterParts.length == 0 ? { _id: { $exists: true } }
    : filterParts.length == 1 ? filterParts[0]
      : { $and: filterParts };
  const pipeline = [
    { $match: { $and: [{ start: { $gte: start } }, { start: { $lt: end } }] } },
    { $project: { roster: '$roster' } },
    { $unwind: '$roster' },
    { $match: filter },
    {
      $group: {
        _id: "$roster.memberId",
        count: { $sum: 1 },
        hours: { $sum: "$roster.hours" },
        miles: { $sum: "$roster.miles", },
        firstName: { $max: "$roster.firstName" },
        lastName: { $max: "$roster.lastName" },
        refNumber: { $max: "$roster.refNumber" },
      }
    },
    { $sort: { [sortByHours ? 'hours' : 'count']: -1 } },
  ];
  const cursor = await client.db().collection<MissionDoc>("missions").aggregate<TopVolunteer>(pipeline);

  return await cursor.toArray();
}

async function getEventStats(collection: string, start?: Date, end?: Date) {
  const client = await clientPromise;
  const match = { $match: { start: { $gte: new Date('2023-03-24') } } };

  let cursor = await client.db().collection(collection).aggregate([
    match,
    { $project: { roster: '$roster' } },
    { $unwind: '$roster' },
    {
      $group: {
        _id: "$roster.memberId",
        hours: { $sum: "$roster.hours" },
        miles: { $sum: "$roster.miles" },
      }
    },
    {
      $group: {
        _id: null,
        responders: { $sum: 1 },
        hours: { $sum: "$hours" },
        miles: { $sum: "$miles" },
      }
    },
  ]);
  const result = (await cursor.toArray())[0];

  cursor = await client.db().collection(collection).aggregate([
    match,
    { $count: 'count' },
  ]);

  return JSON.parse(JSON.stringify({
    count: (await cursor.toArray())[0].count,
    ...result,
  }));
}

export async function getMissionStats(start?: Date, end?: Date) {
  return await getEventStats('missions', start, end);
}
