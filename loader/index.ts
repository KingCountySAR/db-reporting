import { MongoClient } from 'mongodb';
import { D4HWebClient } from './d4h/lib/src/d4hWebClient';
import { loadMissions } from './loadMissions';
import { loadMembers } from './loadMembers';


const mongo = new MongoClient(process.env.MONGODB_URI!);
const d4hWebClient = new D4HWebClient();

// async function foo() {
//   const d4hMembers = (await d4h<Member>('/team/members?include_custom_fields=true&status=Deleted'));
//   console.log(d4hMembers[0]);
//   console.log(d4hMembers.length);
// }
// //foo();

// async function fixupRosters() {
//   const members = (await mongo.db().collection<MemberDoc>("members").find().toArray()).reduce((a,c) => ({ ...a, [c.memberId!]: c._id }), {});
//   const missions = await mongo.db().collection<MissionDoc>("missions").find().toArray();

//   for (const mission of missions) {
//     let dirty = false
//     for (const rosterRow of mission.roster) {
//       if (typeof rosterRow.memberId === 'string') {
//         //console.log(rosterRow.memberId, typeof rosterRow.memberId, )
//         const mongoId = members[rosterRow.memberId];
//         if (!mongoId) throw new Error('cant find mongo member ' + rosterRow.memberId)
//         rosterRow.memberId = mongoId;
//         dirty = true
//       }
//     }
//     if (dirty) {
//       await mongo.db().collection<MissionDoc>("missions").replaceOne({ _id: mission._id }, mission);
//       console.log(mission.refNumber + ' ' + mission.title)
//     }
//   }
// }

Promise.resolve()
.then(() => loadMembers(mongo))
.then(() => loadMissions(mongo, d4hWebClient))
.then(() => {
  mongo.close();
  console.log('all done');
})