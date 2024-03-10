import clientPromise from '../mongodb';

async function getEventStats(collection: string, start?: Date, end?: Date) {
  const client = await clientPromise;
  const match = { $match: { start: { $gte: new Date('2023-03-24')} }};

  let cursor = await client.db().collection(collection).aggregate([
    match,
    { $project: { roster: '$roster' }},
    { $unwind: '$roster' },
    { $group: {
      _id: "$roster.memberId",
      hours: { $sum: "$roster.hours" },
      miles: { $sum: "$roster.miles" },
    }},
    { $group: {
      _id: null,
      responders: { $sum: 1 },
      hours: { $sum: "$hours" },
      miles: { $sum: "$miles" },
    }},
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
