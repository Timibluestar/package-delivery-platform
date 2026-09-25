import { sql } from "@/lib/db";
import { getShipmentMedia } from "@/lib/shipment-media";

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
  media: Awaited<ReturnType<typeof getShipmentMedia>>;
};

type PersonAddress = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

type CreateShipmentInput = {
  customerId: string;
  service: "standard" | "express" | "business";
  shipmentType: "domestic" | "international";
  status: ShipmentStatus;
  sender: PersonAddress;
  recipient: PersonAddress;
  package: {
    description: string;
    weightKg: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  };
  estimatedDelivery: string;
};

type ShipmentRow = {
  id: string;
  tracking_number: string;
  shipment_type: string;
  service: string;
  status: string;
  shipping_price: string | number | null;
  shipping_currency: string | null;
  price_disclosed_at: string | Date | null;
  package_description: string;
  package_weight: string | number;
  estimated_delivery: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  sender_first_name: string;
  sender_last_name: string;
  sender_address_line1: string;
  sender_city: string;
  sender_country: string;
  sender_phone: string | null;
  sender_email: string | null;
  recipient_first_name: string;
  recipient_last_name: string;
  recipient_address_line1: string;
  recipient_city: string;
  recipient_country: string;
  recipient_phone: string | null;
  recipient_email: string | null;
};

type EventRow = {
  id: string;
  shipment_id: string;
  status: string;
  title: string;
  description: string | null;
  location: string | null;
  created_at: string | Date;
};

function splitName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ");

  const firstName = parts.shift() || "Customer";
  const lastName = parts.join(" ") || firstName;

  return {
    firstName,
    lastName,
  };
}

function toIso(value: string | Date | null) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function toShipmentStatus(value: string): ShipmentStatus {
  switch (value) {
    case "confirmed":
    case "in_transit":
    case "out_for_delivery":
    case "delivered":
    case "cancelled":
    case "pending":
      return value;
    default:
      return "pending";
  }
}

function toService(value: string): "standard" | "express" | "business" {
  if (value === "express" || value === "business") {
    return value;
  }

  return "standard";
}

function toShipmentType(value: string): "domestic" | "international" {
  return value === "domestic" ? "domestic" : "international";
}

async function getEvents(shipmentIds: string[]) {
  if (shipmentIds.length === 0) {
    return new Map<string, TrackingEvent[]>();
  }

  const rows = await sql`
    SELECT
      id,
      shipment_id,
      status,
      title,
      description,
      location,
      created_at
    FROM shipment_events
    WHERE shipment_id = ANY(${shipmentIds}::uuid[])
    ORDER BY created_at ASC
  `;

  const eventsByShipment = new Map<string, TrackingEvent[]>();

  for (const row of rows as EventRow[]) {
    const event: TrackingEvent = {
      id: row.id,
      status: toShipmentStatus(row.status),
      title: row.title,
      description: row.description ?? "",
      location: row.location ?? "",
      timestamp: toIso(row.created_at),
    };

    const events = eventsByShipment.get(row.shipment_id) ?? [];
    events.push(event);
    eventsByShipment.set(row.shipment_id, events);
  }

  return eventsByShipment;
}

function mapShipment(
  row: ShipmentRow,
  events: TrackingEvent[],
  media: Awaited<ReturnType<typeof getShipmentMedia>>,
): Shipment {
  const senderName =
    `${row.sender_first_name} ${row.sender_last_name}`.trim();

  const recipientName =
    `${row.recipient_first_name} ${row.recipient_last_name}`.trim();

  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    service: toService(row.service),
    shipmentType: toShipmentType(row.shipment_type),
    status: toShipmentStatus(row.status),

    sender: {
      name: senderName,
      email: row.sender_email ?? "",
      phone: row.sender_phone ?? "",
      address: row.sender_address_line1,
      city: row.sender_city,
      country: row.sender_country,
    },

    recipient: {
      name: recipientName,
      email: row.recipient_email ?? "",
      phone: row.recipient_phone ?? "",
      address: row.recipient_address_line1,
      city: row.recipient_city,
      country: row.recipient_country,
    },

    package: {
      description: row.package_description,
      weightKg: Number(row.package_weight),
    },

    estimatedDelivery: toIso(row.estimated_delivery),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    events,
    media,
  };
}


async function queryShipments(customerId?: string) {
  const rows = customerId
    ? await sql`
        SELECT
          s.id,
          s.tracking_number,
          s.shipment_type,
          s.service,
          s.status,
          s.shipping_price,
          s.shipping_currency,
          s.price_disclosed_at,
          s.package_description,
          s.package_weight,
          s.estimated_delivery,
          s.created_at,
          s.updated_at,

          sa.first_name AS sender_first_name,
          sa.last_name AS sender_last_name,
          sa.address_line1 AS sender_address_line1,
          sa.city AS sender_city,
          sa.country AS sender_country,
          sa.phone AS sender_phone,

          ra.first_name AS recipient_first_name,
          ra.last_name AS recipient_last_name,
          ra.address_line1 AS recipient_address_line1,
          ra.city AS recipient_city,
          ra.country AS recipient_country,
          ra.phone AS recipient_phone

        FROM shipments s

        LEFT JOIN addresses sa
          ON sa.id = s.sender_address_id

        LEFT JOIN addresses ra
          ON ra.id = s.recipient_address_id

        WHERE s.customer_id = ${customerId}

        ORDER BY s.created_at DESC
      `
    : await sql`
        SELECT
          s.id,
          s.tracking_number,
          s.shipment_type,
          s.service,
          s.status,
          s.shipping_price,
          s.shipping_currency,
          s.price_disclosed_at,
          s.package_description,
          s.package_weight,
          s.estimated_delivery,
          s.created_at,
          s.updated_at,

          sa.first_name AS sender_first_name,
          sa.last_name AS sender_last_name,
          sa.address_line1 AS sender_address_line1,
          sa.city AS sender_city,
          sa.country AS sender_country,
          sa.phone AS sender_phone,

          ra.first_name AS recipient_first_name,
          ra.last_name AS recipient_last_name,
          ra.address_line1 AS recipient_address_line1,
          ra.city AS recipient_city,
          ra.country AS recipient_country,
          ra.phone AS recipient_phone

        FROM shipments s

        LEFT JOIN addresses sa
          ON sa.id = s.sender_address_id

        LEFT JOIN addresses ra
          ON ra.id = s.recipient_address_id

        WHERE s.tracking_number IS NOT NULL

        ORDER BY s.created_at DESC
      `;

  const shipmentRows = rows as ShipmentRow[];
  const eventsByShipment = await getEvents(
    shipmentRows.map((row) => row.id),
  );

  const shipments = [];

  for (const row of shipmentRows) {
    const media = await getShipmentMedia(row.id);

    shipments.push(
      mapShipment(
        row,
        eventsByShipment.get(row.id) ?? [],
        media,
      ),
    );
  }

  return shipments;
}

export async function getShipments(customerId: string) {
  return queryShipments(customerId);
}

export async function createShipment(input: CreateShipmentInput) {
  const senderName = splitName(input.sender.name);
  const recipientName = splitName(input.recipient.name);

  let senderAddressId: string | null = null;
  let recipientAddressId: string | null = null;
  let shipmentId: string | null = null;

  try {
    const senderAddressRows = await sql`
      INSERT INTO addresses (
        customer_id,
        first_name,
        last_name,
        company,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        phone
      )
      VALUES (
        ${input.customerId},
        ${senderName.firstName},
        ${senderName.lastName},
        NULL,
        ${input.sender.address},
        NULL,
        ${input.sender.city},
        NULL,
        NULL,
        ${input.sender.country},
        ${input.sender.phone}
      )
      RETURNING id
    `;

    senderAddressId = String(senderAddressRows[0].id);

    const recipientAddressRows = await sql`
      INSERT INTO addresses (
        customer_id,
        first_name,
        last_name,
        company,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        phone
      )
      VALUES (
        ${input.customerId},
        ${recipientName.firstName},
        ${recipientName.lastName},
        NULL,
        ${input.recipient.address},
        NULL,
        ${input.recipient.city},
        NULL,
        NULL,
        ${input.recipient.country},
        ${input.recipient.phone}
      )
      RETURNING id
    `;

    recipientAddressId = String(recipientAddressRows[0].id);

    let trackingNumber = "";

    for (;;) {
      const candidate =
        `PF-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(
          1000 + Math.random() * 9000,
        )}`;

      const existing = await sql`
        SELECT id
        FROM shipments
        WHERE tracking_number = ${candidate}
        LIMIT 1
      `;

      if (existing.length === 0) {
        trackingNumber = candidate;
        break;
      }
    }

    const shipmentRows = await sql`
      INSERT INTO shipments (
        customer_id,
        tracking_number,
        shipment_type,
        service,
        status,
        sender_address_id,
        recipient_address_id,
        package_description,
        package_weight,
        estimated_delivery
      )
      VALUES (
        ${input.customerId},
        ${trackingNumber},
        ${input.shipmentType},
        ${input.service},
        ${input.status},
        ${senderAddressId},
        ${recipientAddressId},
        ${input.package.description},
        ${input.package.weightKg},
        ${input.estimatedDelivery}
      )
      RETURNING id
    `;

    shipmentId = String(shipmentRows[0].id);

    await sql`
      INSERT INTO shipment_events (
        shipment_id,
        status,
        title,
        description,
        location
      )
      VALUES (
        ${shipmentId},
        ${input.status},
        'Shipment created',
        'Your shipment has been created and is awaiting processing.',
        ${`${input.sender.city}, ${input.sender.country}`}
      )
    `;

    const created = await queryShipments(input.customerId);

    const shipment = created.find((item) => item.id === shipmentId);

    if (!shipment) {
      throw new Error("Created shipment could not be loaded.");
    }

    return shipment;
  } catch (error) {
    if (shipmentId) {
      await sql`
        DELETE FROM shipments
        WHERE id = ${shipmentId}
      `;
    }

    if (recipientAddressId) {
      await sql`
        DELETE FROM addresses
        WHERE id = ${recipientAddressId}
      `;
    }

    if (senderAddressId) {
      await sql`
        DELETE FROM addresses
        WHERE id = ${senderAddressId}
      `;
    }

    throw error;
  }
}

export async function findShipment(trackingNumber: string) {
  const normalized = trackingNumber.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const rows = await sql`
    SELECT
      s.id,
      s.tracking_number,
      s.shipment_type,
      s.service,
      s.status,
      s.shipping_price,
      s.shipping_currency,
      s.price_disclosed_at,
      s.package_description,
      s.package_weight,
      s.estimated_delivery,
      s.created_at,
      s.updated_at,

      sa.first_name AS sender_first_name,
      sa.last_name AS sender_last_name,
      sa.address_line1 AS sender_address_line1,
      sa.city AS sender_city,
      sa.country AS sender_country,
      sa.phone AS sender_phone,
      NULL::text AS sender_email,

      ra.first_name AS recipient_first_name,
      ra.last_name AS recipient_last_name,
      ra.address_line1 AS recipient_address_line1,
      ra.city AS recipient_city,
      ra.country AS recipient_country,
      ra.phone AS recipient_phone,
      NULL::text AS recipient_email

    FROM shipments s

    LEFT JOIN addresses sa
      ON sa.id = s.sender_address_id

    LEFT JOIN addresses ra
      ON ra.id = s.recipient_address_id

    WHERE UPPER(s.tracking_number) = ${normalized}
    LIMIT 1
  `;

  const shipmentRow = rows[0] as ShipmentRow | undefined;

  if (!shipmentRow) {
    return null;
  }

  const eventsByShipment = await getEvents([shipmentRow.id]);

  const media = await getShipmentMedia(shipmentRow.id);

  return mapShipment(
    shipmentRow,
    eventsByShipment.get(shipmentRow.id) ?? [],
    media,
  );
}
