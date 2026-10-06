// Merchant-side legal documents. Bump AGREEMENTS_VERSION when wording changes.
export const AGREEMENTS_VERSION = '2026-10-07';

export type AgreementId =
  | 'merchant-agreement'
  | 'sla'
  | 'food-safety'
  | 'terms'
  | 'privacy'
  | 'data-ip';

export interface AgreementDoc {
  id: AgreementId;
  title: string;
  summary: string;
  sections: { heading: string; points: string[] }[];
}

export const AGREEMENTS: Record<AgreementId, AgreementDoc> = {
  'merchant-agreement': {
    id: 'merchant-agreement',
    title: 'Merchant Agreement',
    summary: 'The commercial terms between your outlet and Munchii, including fees and payouts.',
    sections: [
      { heading: 'Parties & scope', points: [
        'This agreement is between Munchii (munchii.in) and the merchant registering the outlet.',
        'Munchii is a pickup-only pre-order platform. Munchii does not deliver orders.',
        'The merchant remains the seller of all items and is responsible for their preparation and quality.',
      ]},
      { heading: 'Fees & commission', points: [
        'Munchii charges a 5% commission on the item total of every completed order.',
        'Customers pay a ₹3 platform fee per order; this fee is not part of merchant earnings.',
        'Fees may change with at least 15 days of prior notice inside the merchant app.',
      ]},
      { heading: 'Payments & payouts', points: [
        'All payments are collected online through Razorpay. Cash on pickup is not offered.',
        'Merchant earnings = item total minus commission, settled to the saved bank account or UPI ID.',
        'Refunds for cancelled or rejected paid orders are deducted from the related earnings.',
      ]},
      { heading: 'Term & termination', points: [
        'Either party may end this agreement with 7 days of written notice.',
        'Munchii may suspend an outlet immediately for fraud, safety risks or repeated policy breaches.',
        'Earnings for completed orders up to termination are paid out in the next settlement cycle.',
      ]},
    ],
  },
  sla: {
    id: 'sla',
    title: 'Service Level Agreement (SLA)',
    summary: 'The service standards your outlet commits to for every order.',
    sections: [
      { heading: 'Order handling', points: [
        'Accept or reject new orders promptly after they appear in the Orders screen.',
        'Have each order ready by the pickup time chosen by the customer.',
        'Keep preparation time, pickup slots and capacity settings accurate.',
      ]},
      { heading: 'Availability', points: [
        'Keep opening hours and the outlet online/offline switch up to date.',
        'Mark items unavailable as soon as they run out.',
        'Switch the outlet offline or pause orders when you cannot serve customers.',
      ]},
      { heading: 'Pickup handover', points: [
        'Hand over an order only after verifying the customer\'s 4-digit pickup code.',
        'Orders handed over without code verification are the merchant\'s responsibility.',
      ]},
      { heading: 'Performance review', points: [
        'Munchii monitors rejections, late orders, cancellations and customer ratings.',
        'Repeated SLA breaches may lead to lower visibility, warnings or suspension.',
      ]},
    ],
  },
  'food-safety': {
    id: 'food-safety',
    title: 'Food Safety Indemnity Agreement',
    summary: 'Your responsibility for food safety, licences and product quality.',
    sections: [
      { heading: 'Licences & compliance', points: [
        'The merchant holds and maintains a valid FSSAI licence and any other required licences.',
        'The merchant follows all applicable food safety, hygiene and packaging laws.',
      ]},
      { heading: 'Product information', points: [
        'Item names, descriptions, prices, veg/non-veg markers and quantities must be accurate.',
        'Allergen and ingredient information must be shared when customers ask.',
      ]},
      { heading: 'Indemnity', points: [
        'The merchant is solely responsible for the safety and quality of items sold.',
        'The merchant indemnifies Munchii against claims, losses or penalties arising from food safety issues, contamination, mislabelling or licence violations.',
        'Munchii may remove items or suspend the outlet when a safety complaint is reported.',
      ]},
    ],
  },
  terms: {
    id: 'terms',
    title: 'Merchant Terms & Conditions',
    summary: 'The rules for using the Munchii merchant app.',
    sections: [
      { heading: 'Account', points: [
        'Provide true and complete business, owner and bank details during registration.',
        'Your outlet goes live only after Munchii verifies your details.',
        'Keep your login private. You are responsible for all activity on your account.',
      ]},
      { heading: 'Conduct', points: [
        'Do not list prohibited, illegal or misleading items.',
        'Do not ask customers to pay outside Munchii or contact them for unrelated purposes.',
        'Treat customers respectfully; abusive behaviour may lead to suspension.',
      ]},
      { heading: 'Changes', points: [
        'Munchii may update these terms. Material changes are announced in the app.',
        'Continuing to use the merchant app after changes means you accept them.',
      ]},
    ],
  },
  privacy: {
    id: 'privacy',
    title: 'Merchant Privacy Policy',
    summary: 'How Munchii collects, protects and uses merchant information.',
    sections: [
      { heading: 'What we collect', points: [
        'Owner name, email, phone, outlet details, location and photos.',
        'Compliance details (FSSAI, GST, PAN, Aadhaar) and bank or UPI details for payouts.',
      ]},
      { heading: 'How we protect it', points: [
        'PAN, Aadhaar and bank details are encrypted and visible only to you and Munchii admins.',
        'We never sell merchant data.',
      ]},
      { heading: 'Your rights', points: [
        'You can view and update your details in More at any time.',
        'You can request account deletion by contacting Munchii support.',
      ]},
    ],
  },
  'data-ip': {
    id: 'data-ip',
    title: 'Data Sharing & IP Agreement',
    summary: 'What data is shared with customers and who owns content on Munchii.',
    sections: [
      { heading: 'Data shared with customers', points: [
        'Outlet name, address, location, phone, hours, photos, menu and the owner\'s name are shown to customers.',
        'Customer names and contact details are shared with you only to fulfil their orders and must not be used for anything else.',
      ]},
      { heading: 'Content & intellectual property', points: [
        'You keep ownership of your brand name, logo, photos and menu content.',
        'You grant Munchii a free, non-exclusive licence to display and promote this content on Munchii.',
        'You confirm you have the right to use every image and name you upload.',
        'The Munchii name, logo and app remain the property of Munchii.',
      ]},
    ],
  },
};

/** Sign-up checkboxes. */
export const SIGNUP_CONSENT_GROUPS: { key: 'commercial' | 'platform'; label: string; docs: AgreementId[] }[] = [
  { key: 'commercial', label: 'Commercial & Operational core', docs: ['merchant-agreement', 'sla', 'food-safety'] },
  { key: 'platform', label: 'Platform rules & Privacy core', docs: ['terms', 'privacy', 'data-ip'] },
];

/** Groups shown in More. */
export const MORE_LEGAL_GROUPS: { slug: string; title: string; description: string; docs: AgreementId[] }[] = [
  { slug: 'contract', title: 'My contract & fees', description: 'Merchant agreement, commission and payouts', docs: ['merchant-agreement'] },
  { slug: 'performance', title: 'Performance & rules', description: 'Service levels and food safety', docs: ['sla', 'food-safety'] },
  { slug: 'legal', title: 'Legal & policies', description: 'Terms, privacy, data sharing and IP', docs: ['terms', 'privacy', 'data-ip'] },
];
