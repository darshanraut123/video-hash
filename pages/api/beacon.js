import { v4 as uuidv4 } from "uuid";

let beaconHistory = [];

// Function to generate a unique value (e.g., UUID)
function generateUniqueValue() {
  const timestamp = Math.floor(Date.now() / 1000);
  const uniqueValue = uuidv4();
  const beaconValue = {
    timestamp,
    uniqueValue,
  };
  beaconHistory.push(beaconValue);
  return beaconValue;
}

export default function handler(req, res) {
  const latestBeacon = generateUniqueValue();
  res.status(200).json(latestBeacon);
}
