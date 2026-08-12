export type InfoPageSection = {
  heading: string;
  body: string;
};

export type InfoPage = {
  slug: string;
  title: string;
  subtitle: string;
  placeholder?: boolean;
  sections: InfoPageSection[];
};

export const infoPages: Record<string, InfoPage> = {
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    subtitle: "The rules for using our website and placing orders.",
    placeholder: true,
    sections: [
      {
        heading: "Overview",
        body:
          "These terms govern your use of the Jalal's Home Solution website and any purchases or quotation requests made through it. Final legal text will be supplied by the client before launch.",
      },
      {
        heading: "Orders & quotations",
        body:
          "Prices shown online are indicative unless marked as instant checkout. Custom-sized carpets, flooring and made-to-measure furniture may require a confirmed quotation before payment. We reserve the right to decline orders with incorrect pricing or unavailable stock.",
      },
      {
        heading: "Payment",
        body:
          "Cash on delivery and bank transfer are available for confirmed orders. Online card payments will be introduced in a later phase.",
      },
      {
        heading: "Contact",
        body:
          "Questions about these terms? Email orders@jalalsgroup.com or visit any of our five showrooms across Gilgit-Baltistan.",
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    subtitle: "How we collect, use and protect your personal information.",
    placeholder: true,
    sections: [
      {
        heading: "Information we collect",
        body:
          "When you register, place an order, request a quote or contact us, we may collect your name, email, phone number, delivery address and order history. Payment details are handled by our payment partners and are not stored on our servers.",
      },
      {
        heading: "How we use your data",
        body:
          "We use your information to process orders, respond to inquiries, improve our services and send order updates. Marketing emails are opt-in only.",
      },
      {
        heading: "Your rights",
        body:
          "You may request access to, correction of, or deletion of your personal data by contacting us. Final privacy policy text will be reviewed by legal counsel before launch.",
      },
    ],
  },
  delivery: {
    slug: "delivery",
    title: "Delivery Information",
    subtitle: "Nationwide delivery across Pakistan with expert handling for large items.",
    sections: [
      {
        heading: "Coverage",
        body:
          "We deliver across Gilgit-Baltistan and nationwide to major cities in Pakistan. Remote areas may require additional lead time — our team will confirm before dispatch.",
      },
      {
        heading: "Free delivery",
        body:
          "Free delivery is available on orders above Rs. 50,000 within supported regions. Smaller orders and remote locations may incur a delivery fee quoted at checkout.",
      },
      {
        heading: "Large items",
        body:
          "Carpets, rugs, sofas and flooring are packed and handled by trained staff. Installation services are available in selected cities — ask at your nearest branch.",
      },
      {
        heading: "Tracking",
        body:
          "Once your order is dispatched, you will receive confirmation by phone or email with an estimated delivery window.",
      },
    ],
  },
  returns: {
    slug: "returns",
    title: "Returns & Exchanges",
    subtitle: "Our policy for standard products and custom-made items.",
    placeholder: true,
    sections: [
      {
        heading: "Standard products",
        body:
          "Ready-made rugs, cushions, décor and stocked furniture may be returned within 7 days of delivery if unused and in original packaging. Contact your branch or email orders@jalalsgroup.com to initiate a return.",
      },
      {
        heading: "Custom & made-to-measure",
        body:
          "Items cut, sized or personalised to your specifications cannot be returned unless there is a manufacturing defect. You will acknowledge this before confirming a custom order.",
      },
      {
        heading: "Damaged items",
        body:
          "Inspect deliveries on arrival. Report damage within 48 hours with photos and we will arrange repair, replacement or refund as appropriate.",
      },
    ],
  },
  warranty: {
    slug: "warranty",
    title: "Warranty",
    subtitle: "Quality guarantee on products and installation.",
    placeholder: true,
    sections: [
      {
        heading: "Product warranty",
        body:
          "Manufacturing defects on carpets, rugs and furniture are covered for the period stated on your invoice. Normal wear, improper care and unauthorised modifications are excluded.",
      },
      {
        heading: "Installation",
        body:
          "Where Jalal's provides installation, workmanship is guaranteed for 12 months from completion. Report issues promptly so we can inspect and remedy.",
      },
      {
        heading: "Making a claim",
        body:
          "Bring your invoice and photos to any branch, or email orders@jalalsgroup.com with your order number and a description of the issue.",
      },
    ],
  },
  faqs: {
    slug: "faqs",
    title: "Frequently Asked Questions",
    subtitle: "Quick answers about shopping, delivery and custom orders.",
    sections: [
      {
        heading: "Do you offer custom carpet sizes?",
        body:
          "Yes. We specialise in made-to-measure carpets and rugs. Share your room dimensions at any branch or through our contact form for a quotation.",
      },
      {
        heading: "How many showrooms do you have?",
        body:
          "Five showrooms across Gilgit-Baltistan: Gilgit, Hunza, Skardu, Gakuch and Kashrot. Visit our Store Locator page for addresses and phone numbers.",
      },
      {
        heading: "Can I order online and pay on delivery?",
        body:
          "Cash on delivery is available for confirmed standard orders in supported areas. Custom and quotation-based orders require confirmation before dispatch.",
      },
      {
        heading: "Do you install flooring?",
        body:
          "Professional installation is available for flooring and wall-to-wall carpet in selected regions. Ask your branch for availability and pricing.",
      },
      {
        heading: "How long has Jalal's been in business?",
        body:
          "Jalal's has served homeowners across Gilgit-Baltistan since 2005, with over 1,000 premium products and nationwide delivery.",
      },
    ],
  },
};

export function getInfoPage(slug: string): InfoPage | undefined {
  return infoPages[slug];
}

export const infoPageSlugs = Object.keys(infoPages);
