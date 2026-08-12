"use client";



import { useState } from "react";

import { useRouter } from "next/navigation";

import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";

import { toast } from "sonner";



export function AddToCartButton({ variantId }: { variantId: string }) {

  const router = useRouter();

  const [loading, setLoading] = useState(false);



  async function handleClick() {

    setLoading(true);

    try {

      const res = await fetch("/api/cart", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ variantId, quantity: 1 }),

      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed");

      toast.success("Added to cart");

      router.refresh();

    } catch (error) {

      toast.error(error instanceof Error ? error.message : "Could not add to cart");

    } finally {

      setLoading(false);

    }

  }



  return (

    <div className="flex flex-col gap-3 sm:flex-row">

      <Button

        onClick={handleClick}

        disabled={loading}

        size="lg"

        className="flex-1 gap-2 shadow-md shadow-red/20"

      >

        <ShoppingCart className="h-4 w-4" />

        {loading ? "Adding..." : "Add to cart"}

      </Button>

      <Button

        variant="outline"

        size="lg"

        className="flex-1 border-navy/15"

        onClick={() => router.push("/cart")}

      >

        View cart

      </Button>

    </div>

  );

}


