/**
 * Initialise the single-node replica set and wait for primary election.
 *
 * The mongo Docker entrypoint passes --replSet through to the temporary
 * instance that runs these init scripts, so the node starts as a member
 * of an uninitialised RS and refuses writes until rs.initiate() completes
 * and the node wins its election.
 */
try {
  rs.status();
} catch (_) {
  rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] });
}

while (!db.hello().isWritablePrimary) {
  sleep(200);
}

db = db.getSiblingDB('test');
db.test.insertOne({ test: 'data' });
