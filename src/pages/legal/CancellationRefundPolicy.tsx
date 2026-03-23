import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CancellationRefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 pb-20 space-y-8">
        <Link to="/customer/profile/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Link>

        <div>
          <h1 className="text-3xl font-display font-bold">Cancellation & Refund Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Effective Date: 15 March 2026 &nbsp;|&nbsp; Version 1.0 &nbsp;|&nbsp; munchii.in</p>
          <p className="text-xs text-muted-foreground mt-1">Applicable to all food pre-orders placed through the MUNCHii platform</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-display font-semibold">1. Overview</h2>
            <p>MUNCHii is a campus food pre-ordering platform that connects students ("Users") with on-campus food vendors ("Vendor Partners"). This Cancellation and Refund Policy governs all food orders placed through the MUNCHii mobile application and website (munchii.in).</p>
            <p>We understand that situations arise and orders may need to be cancelled. This policy is designed to be fair to both Users and Vendor Partners, keeping in mind that food preparation involves real time and materials.</p>
            <p>By placing an order on MUNCHii, you agree to the terms of this Cancellation & Refund Policy. Please read it carefully before placing your order.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">2. Cancellation Policy</h2>

            <h3 className="text-lg font-display font-semibold">2.1 When Can You Cancel?</h3>
            <p>Cancellations are time-sensitive. Once a vendor starts preparing your order, a cancellation is generally not possible. The cancellation window depends on the order status at the time of your request:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Before Vendor Accepts Order:</strong> You may cancel at any time. Full refund will be issued automatically.</li>
              <li><strong>After Vendor Accepts — within 2 minutes:</strong> You may request cancellation within 2 minutes of vendor acceptance. Refund subject to vendor confirmation.</li>
              <li><strong>Order Under Preparation:</strong> Cancellation is NOT allowed. Food items are being actively prepared.</li>
              <li><strong>Order Ready for Pickup:</strong> Cancellation is NOT allowed. Your order is ready and waiting at the counter.</li>
            </ul>
            <p className="text-muted-foreground text-sm">Note: The cancellation window is strictly time-based. MUNCHii is not responsible for missed cancellation windows due to delayed action by the User. For exceptional cases, email <a href="mailto:support.munchii.in@gmail.com" className="text-primary hover:underline">support.munchii.in@gmail.com</a>.</p>

            <h3 className="text-lg font-display font-semibold mt-4">2.2 How to Cancel an Order</h3>
            <p>To cancel an eligible order, follow these steps in the MUNCHii app:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Go to your Profile by tapping the profile icon on the bottom navigation bar</li>
              <li>Tap the Orders icon on your profile page</li>
              <li>Select your Live Order from the active orders list</li>
              <li>If cancellation is still within the eligible window, a 'Cancel Order' button will be visible — tap it</li>
              <li>Confirm your cancellation reason when prompted</li>
              <li>You will receive an in-app notification and email confirmation once the cancellation is processed</li>
            </ul>
            <p className="text-muted-foreground text-sm">If the Cancel button is not visible, it means the order has moved past the eligible cancellation window and can no longer be cancelled.</p>

            <h3 className="text-lg font-display font-semibold mt-4">2.3 Vendor-Initiated Cancellations</h3>
            <p>In rare situations, a Vendor Partner may cancel your order due to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Unavailability of an ordered item</li>
              <li>Technical issues on the vendor's end</li>
              <li>Temporary closure of the vendor shop</li>
              <li>Force majeure situations (power outage, emergency, etc.)</li>
            </ul>
            <p>In all cases of vendor-initiated cancellations, you will receive a 100% full refund automatically. MUNCHii will notify you via app notification and email immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">3. Refund Policy</h2>

            <h3 className="text-lg font-display font-semibold">3.1 Refund Eligibility Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 border-b border-border font-semibold">Order Status</th>
                    <th className="text-left p-3 border-b border-border font-semibold">Cancel Window</th>
                    <th className="text-left p-3 border-b border-border font-semibold">Refund Type</th>
                    <th className="text-left p-3 border-b border-border font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="p-3">Before vendor accepts</td>
                    <td className="p-3">Anytime</td>
                    <td className="p-3 text-primary font-medium">100% Full Refund</td>
                    <td className="p-3">Automatic — within 2–3 business days</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3">After acceptance (within 2 min)</td>
                    <td className="p-3">2 minutes</td>
                    <td className="p-3 text-primary font-medium">100% Full Refund</td>
                    <td className="p-3">Contact support for exceptional cases</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3">Order being prepared</td>
                    <td className="p-3">Not allowed</td>
                    <td className="p-3">No Refund*</td>
                    <td className="p-3">Contact support for exceptional cases</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3">Order ready for pickup</td>
                    <td className="p-3">Not allowed</td>
                    <td className="p-3">No Refund*</td>
                    <td className="p-3">Contact support for exceptional cases</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3">Cancelled by Vendor</td>
                    <td className="p-3">N/A</td>
                    <td className="p-3 text-primary font-medium">100% Full Refund</td>
                    <td className="p-3">Automatic — within 2–3 business days</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3">Wrong / Missing Item</td>
                    <td className="p-3">Within 1 hour</td>
                    <td className="p-3">Full or Partial Refund</td>
                    <td className="p-3">Support review — 3–5 business days</td>
                  </tr>
                  <tr>
                    <td className="p-3">Food quality issue (with proof)</td>
                    <td className="p-3">Within 1 hour</td>
                    <td className="p-3">Partial / Full Refund</td>
                    <td className="p-3">Support review — 3–5 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">*Exceptions may be considered at MUNCHii's sole discretion for documented extraordinary circumstances. Contact <a href="mailto:support.munchii.in@gmail.com" className="text-primary hover:underline">support.munchii.in@gmail.com</a> within 1 hour of the incident.</p>

            <h3 className="text-lg font-display font-semibold mt-4">3.2 Refunds for Wrong or Missing Items</h3>
            <p>If your completed order has a wrong item delivered or a missing item, you are entitled to a refund under the following conditions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must report the issue within 1 hour of receiving your order via the MUNCHii app or by emailing <a href="mailto:support.munchii.in@gmail.com" className="text-primary hover:underline">support.munchii.in@gmail.com</a>.</li>
              <li>You must provide photographic evidence of the incorrect or missing item.</li>
              <li>MUNCHii support will verify the claim with the Vendor Partner.</li>
              <li>Upon verification, a full refund for the affected item(s) will be issued.</li>
            </ul>
            <p>MUNCHii coins (loyalty rewards) from the affected order will also be reversed or re-issued accordingly upon resolution.</p>

            <h3 className="text-lg font-display font-semibold mt-4">3.3 Refunds for Food Quality Issues</h3>
            <p>MUNCHii takes food quality seriously. If you receive food that is:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Spoiled, contaminated, or inedible</li>
              <li>Significantly different from what was described on the menu</li>
              <li>Causing or suspected of causing illness</li>
            </ul>
            <p>You may raise a quality complaint. To be eligible:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Report within 1 hour of receiving the order</li>
              <li>Provide clear photographic/video evidence</li>
              <li>Do not dispose of the food before support review is complete</li>
            </ul>
            <p>MUNCHii will investigate the complaint with the concerned Vendor Partner. Depending on the outcome, a partial or full refund may be issued. Repeated quality issues from a vendor may result in their suspension from the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">4. Refund Processing</h2>

            <h3 className="text-lg font-display font-semibold">4.1 Refund Methods</h3>
            <p>Refunds will be credited back to the original payment method used at the time of the order:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 border-b border-border font-semibold">Payment Method</th>
                    <th className="text-left p-3 border-b border-border font-semibold">Refund Credit Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="p-3">UPI (GPay, PhonePe, Paytm, etc.)</td>
                    <td className="p-3">2–3 business days</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3">Debit Card / Credit Card</td>
                    <td className="p-3">5–7 business days</td>
                  </tr>
                  <tr>
                    <td className="p-3">Net Banking</td>
                    <td className="p-3">3–5 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Timelines are indicative and may vary based on your bank or payment service provider. MUNCHii is not responsible for delays caused by third-party payment processors.</p>

            <h3 className="text-lg font-display font-semibold mt-4">4.2 MUNCHii Coins on Refunds</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Coins earned from a fully refunded order will be reversed from your wallet</li>
              <li>For partial refunds, coins will be proportionally adjusted</li>
              <li>Coins already redeemed as a discount on the refunded order will not be re-credited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">5. Non-Refundable Situations</h2>
            <p>Refunds will NOT be issued in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>User fails to pick up the order within the designated pickup window</li>
              <li>User changes their mind after the preparation has commenced</li>
              <li>Order was consumed partially or fully before raising a complaint</li>
              <li>User provided incorrect pickup details or did not follow pickup instructions</li>
              <li>Complaint raised beyond the 1-hour window post-receipt (unless exceptional circumstances apply)</li>
              <li>Promotional or discounted orders where the offer terms explicitly state 'non-refundable'</li>
              <li>Orders placed using expired or unauthorised discount codes or referral credits</li>
            </ul>
            <p className="text-muted-foreground text-sm">If you believe your situation warrants a special review, contact our support team. All decisions by MUNCHii support regarding exceptional refund requests are final.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">6. Dispute Resolution</h2>
            <p>If you are unsatisfied with MUNCHii's refund decision, you may escalate the dispute through the following process:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Step 1:</strong> Contact MUNCHii support at <a href="mailto:support.munchii.in@gmail.com" className="text-primary hover:underline">support.munchii.in@gmail.com</a> with your Order ID, issue description, and supporting evidence</li>
              <li><strong>Step 2:</strong> Our team will respond within 48 hours with an investigation update</li>
              <li><strong>Step 3:</strong> If unresolved, you may escalate to our Grievance Officer at <a href="mailto:munchii.in.prm@gmail.com" className="text-primary hover:underline">munchii.in.prm@gmail.com</a></li>
              <li><strong>Step 4:</strong> For unresolved payment disputes, you may raise a chargeback with your bank or UPI provider</li>
            </ul>
            <p>MUNCHii will cooperate fully with any legitimate chargeback investigation. Fraudulent chargeback attempts may result in account suspension.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">7. Platform Fees & Convenience Charges</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Platform/convenience fees are non-refundable in cases where the order was successfully fulfilled</li>
              <li>If an order is cancelled before vendor acceptance, the platform fee will also be refunded in full</li>
              <li>If an order is cancelled after vendor acceptance, the platform fee may be partially retained</li>
            </ul>
            <p>The exact platform fee applicable to your order will always be displayed transparently at the checkout screen before you confirm your payment.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">8. Contact Us</h2>
            <p>For any cancellation, refund, or order-related queries, please reach out to us:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">Support Email</td>
                    <td className="p-3"><a href="mailto:support.munchii.in@gmail.com" className="text-primary hover:underline">support.munchii.in@gmail.com</a></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">Grievance Officer</td>
                    <td className="p-3"><a href="mailto:munchii.in.prm@gmail.com" className="text-primary hover:underline">munchii.in.prm@gmail.com</a></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">Website</td>
                    <td className="p-3">munchii.in</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">Registered Business</td>
                    <td className="p-3">MUNCHii — Sole Proprietorship, India</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Support Hours</td>
                    <td className="p-3">Monday to Saturday, 9:00 AM – 7:00 PM IST</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">9. Policy Updates</h2>
            <p>MUNCHii reserves the right to modify this Cancellation and Refund Policy at any time. Changes will be:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Published on the MUNCHii website at munchii.in/refund-policy</li>
              <li>Notified to registered users via email and in-app notification at least 7 days before taking effect</li>
              <li>Reflected in the 'Effective Date' at the top of this document</li>
            </ul>
            <p>Continued use of the MUNCHii platform after the effective date of any changes constitutes your acceptance of the revised policy.</p>
            <p className="text-muted-foreground text-sm mt-4">Thank you for choosing MUNCHii. We are committed to making your campus food experience seamless, safe, and rewarding.</p>
            <p className="text-muted-foreground text-xs">MUNCHii — Skip the Queue. Earn While You Eat. | munchii.in</p>
          </section>
        </div>
      </div>
    </div>
  );
}
