import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function AccountWishlistPage() {
  return (
    <div>
      <h2 className="font-display text-2xl text-navy sm:text-3xl">Wishlist</h2>
      <p className="mt-2 text-sm text-muted">
        Items you save while browsing the shop.
      </p>

      <EmptyState
        className="mt-8 surface-card"
        icon={<Heart className="h-6 w-6" />}
        title="Your wishlist is empty"
        description="Tap the heart on any product while shopping to save it here. Saved items sync across this device for now."
        action={{ label: "Explore collections", href: "/shop" }}
      />
    </div>
  );
}
