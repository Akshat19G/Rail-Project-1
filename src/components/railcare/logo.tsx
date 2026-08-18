import markAsset from "@/assets/rail-chikitsak-mark.png.asset.json";
import logoAsset from "@/assets/rail-chikitsak-logo.png.asset.json";

export const BRAND_NAME = "Rail Chikitsak";

export function BrandLogo({ className = "h-16" }: { className?: string }) {
  return <img src={logoAsset.url} alt="Rail Chikitsak" className={`object-contain ${className}`} />;
}

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src={markAsset.url}
      alt="Rail Chikitsak logo"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
