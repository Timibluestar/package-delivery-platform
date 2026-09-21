import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
