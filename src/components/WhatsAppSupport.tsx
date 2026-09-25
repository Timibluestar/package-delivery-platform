import Link from "next/link";

export default function WhatsAppSupport() {
  return (
    <Link
      href="https://wa.me/16192415211?text=Hello%20ParcelFlow%20support%2C%20I%20need%20help%20with%20my%20delivery."
      className="parcelflow-whatsapp-global"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with ParcelFlow support on WhatsApp"
    >
      <span>W</span>
      <span>WhatsApp Support</span>
    </Link>
  );
}
