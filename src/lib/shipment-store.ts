import { promises as fs } from "fs";
import path from "path";

export type ShipmentStatus =
  | "pending"
  | "confirmed"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type TrackingEvent = {
  id: string;
  status: ShipmentStatus;
  title: string;
  description: string;
  location: string;
  timestamp: string;
};

export type Shipment = {
  id: string;
  trackingNumber: string;
  service: "standard" | "express" | "business";
  shipmentType: "domestic" | "international";
  status: ShipmentStatus;

  sender: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };

  recipient: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };

  package: {
    description: string;
    weightKg: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  };

  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
  events: TrackingEvent[];
};

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "shipments.json");

async function ensureStore() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

export async function getShipments(): Promise<Shipment[]> {
  await ensureStore();

  const contents = await fs.readFile(dataFile, "utf8");

  try {
    const parsed = JSON.parse(contents);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as Shipment[];
  } catch {
    return [];
  }
}

export async function saveShipments(shipments: Shipment[]) {
  await ensureStore();

  const temporaryFile = `${dataFile}.tmp`;

  await fs.writeFile(
    temporaryFile,
    JSON.stringify(shipments, null, 2) + "\n",
    "utf8",
  );

  await fs.rename(temporaryFile, dataFile);
}

export async function createShipment(
  shipment: Omit<Shipment, "id" | "trackingNumber" | "createdAt" | "updatedAt" | "events">,
) {
  const shipments = await getShipments();

  const now = new Date().toISOString();

  const newShipment: Shipment = {
    ...shipment,
    id: crypto.randomUUID(),
    trackingNumber: await generateTrackingNumber(shipments),
    createdAt: now,
    updatedAt: now,
    events: [
      {
        id: crypto.randomUUID(),
        status: "pending",
        title: "Shipment created",
        description: "Your shipment has been created and is awaiting processing.",
        location: `${shipment.sender.city}, ${shipment.sender.country}`,
        timestamp: now,
      },
    ],
  };

  shipments.unshift(newShipment);
  await saveShipments(shipments);

  return newShipment;
}

async function generateTrackingNumber(existing: Shipment[]) {
  let trackingNumber = "";

  do {
    const part = Math.floor(100000 + Math.random() * 900000);
    trackingNumber = `PF-${part}-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (existing.some((shipment) => shipment.trackingNumber === trackingNumber));

  return trackingNumber;
}

export async function findShipment(trackingNumber: string) {
  const shipments = await getShipments();

  return (
    shipments.find(
      (shipment) =>
        shipment.trackingNumber.toUpperCase() ===
        trackingNumber.trim().toUpperCase(),
    ) ?? null
  );
}
