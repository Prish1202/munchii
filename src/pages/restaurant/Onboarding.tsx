import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useOwnerDetails, useSaveOwnerDetails,
  useMyRestaurantFull, useSaveRestaurantDetails,
  useBankDetails, useSaveBankDetails, useSubmitForVerification,
} from '@/hooks/useRestaurantOnboarding';
import { 
  User, Store, Landmark, ShieldCheck, ArrowRight, ArrowLeft, 
  CheckCircle, Clock, XCircle, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MERCHANT_TYPES, MerchantType, merchantTerms } from '@/lib/merchantTerms';

const MT_KEY = 'munchii_merchant_type';

function MerchantTypeStep({ onSelect }: { onSelect: (t: MerchantType) => void }) {
  return (
    <Card className="rounded-2xl border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-display">What kind of business are you?</CardTitle>
        <p className="text-sm text-muted-foreground">Choose one. This sets up your dashboard.</p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {MERCHANT_TYPES.map(t => (
          <button key={t.value} type="button" onClick={() => onSelect(t.value)}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary/5">
            <span className="text-3xl" aria-hidden>{t.emoji}</span>
            <span>
              <span className="block font-display font-bold">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.tagline}</span>
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

const STEPS = [
  { label: 'Owner Profile', icon: User },
  { label: 'Business Details', icon: Store },
  { label: 'Bank Details', icon: Landmark },
  { label: 'Verification', icon: ShieldCheck },
];

function StepIndicator({ current, steps }: { current: number; steps: typeof STEPS }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              i < current ? "gradient-primary text-primary-foreground" :
              i === current ? "bg-primary text-primary-foreground shadow-lg" :
              "bg-muted text-muted-foreground"
            )}>
              {i < current ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
            </div>
            <span className={cn(
              "text-[10px] sm:text-xs mt-1.5 font-medium text-center",
              i <= current ? "text-foreground" : "text-muted-foreground"
            )}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 mx-2 sm:mx-4 rounded-full transition-all mt-[-16px]",
              i < current ? "gradient-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

function OwnerProfileStep({ onNext }: { onNext: () => void }) {
  const { data: ownerDetails, isLoading } = useOwnerDetails();
  const saveOwner = useSaveOwnerDetails();

  const [form, setForm] = useState({
    pan_number: '', aadhaar_number: '', contact_phone: '', contact_email: '', full_address: '',
  });

  useEffect(() => {
    if (ownerDetails) {
      setForm({
        pan_number: ownerDetails.pan_number || '',
        aadhaar_number: ownerDetails.aadhaar_number || '',
        contact_phone: ownerDetails.contact_phone || '',
        contact_email: ownerDetails.contact_email || '',
        full_address: ownerDetails.full_address || '',
      });
    }
  }, [ownerDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pan_number.trim() || !form.aadhaar_number.trim() || !form.contact_phone.trim() || !form.contact_email.trim()) {
      return;
    }
    await saveOwner.mutateAsync(form);
    onNext();
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Card className="rounded-2xl border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Owner Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground">Your personal identification and contact details</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>PAN Number <span className="text-destructive">*</span></Label>
              <Input placeholder="ABCDE1234F" value={form.pan_number}
                onChange={e => setForm(p => ({ ...p, pan_number: e.target.value.toUpperCase() }))}
                maxLength={10} required />
            </div>
            <div className="space-y-2">
              <Label>Aadhaar Number <span className="text-destructive">*</span></Label>
              <Input placeholder="1234 5678 9012" value={form.aadhaar_number}
                onChange={e => setForm(p => ({ ...p, aadhaar_number: e.target.value }))}
                maxLength={14} required />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Contact Phone <span className="text-destructive">*</span></Label>
              <Input type="tel" placeholder="+91 98765 43210" value={form.contact_phone}
                onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="owner@example.com" value={form.contact_email}
                onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Full Address</Label>
            <Input placeholder="House/Flat No, Street, Locality" value={form.full_address}
              onChange={e => setForm(p => ({ ...p, full_address: e.target.value }))} />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" className="gradient-primary text-primary-foreground rounded-xl px-8"
              disabled={saveOwner.isPending}>
              {saveOwner.isPending ? 'Saving...' : 'Save & Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function RestaurantDetailsStep({ onNext, onBack, merchantType }: { onNext: () => void; onBack: () => void; merchantType: MerchantType }) {
  const { data: restaurant, isLoading } = useMyRestaurantFull();
  const saveRestaurant = useSaveRestaurantDetails();
  const grocery = merchantType === 'grocery';
  const terms = merchantTerms(merchantType);

  const [form, setForm] = useState({
    name: '', address: '', area: '', city: '', contact_phone: '',
    fssai_license: '', gst_number: '', university_name: '',
    shop_license: '', store_category: '',
    opening_hours: '09:00', closing_hours: '22:00',
  });

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        address: restaurant.address || '',
        area: restaurant.area || '',
        city: restaurant.city || '',
        contact_phone: restaurant.contact_phone || '',
        fssai_license: restaurant.fssai_license || '',
        gst_number: restaurant.gst_number || '',
        university_name: restaurant.university_name || '',
        shop_license: restaurant.shop_license || '',
        store_category: restaurant.store_category || '',
        opening_hours: restaurant.opening_hours || '09:00',
        closing_hours: restaurant.closing_hours || '22:00',
      });
    }
  }, [restaurant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.contact_phone.trim()) return;
    if (!grocery && !form.fssai_license.trim()) return;
    if (merchantType === 'canteen' && !form.university_name.trim()) return;
    await saveRestaurant.mutateAsync({ ...form, merchant_type: merchantType });
    onNext();
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Card className="rounded-2xl border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          {terms.business} Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">Tell us about your {terms.business.toLowerCase()}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{terms.business} Name <span className="text-destructive">*</span></Label>
              <Input placeholder={grocery ? 'e.g., Fresh Mart' : 'e.g., Spice Garden'} value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone <span className="text-destructive">*</span></Label>
              <Input type="tel" placeholder="+91 98765 43210" value={form.contact_phone}
                onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Full Address <span className="text-destructive">*</span></Label>
            <Input placeholder="Shop No, Building, Street" value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Area / Locality <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g., MG Road" value={form.area}
                onChange={e => setForm(p => ({ ...p, area: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>City <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g., Bikaner" value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required />
            </div>
          </div>
          {grocery ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Shop / Trade Licence No. <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input placeholder="Shop & Establishment no." value={form.shop_license}
                  onChange={e => setForm(p => ({ ...p, shop_license: e.target.value }))} maxLength={40} />
              </div>
              <div className="space-y-2">
                <Label>Store Category <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input placeholder="e.g., Kirana, Dairy, Fruits & Veg" value={form.store_category}
                  onChange={e => setForm(p => ({ ...p, store_category: e.target.value }))} maxLength={60} />
              </div>
              <div className="space-y-2">
                <Label>FSSAI Registration <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input placeholder="If you have one" value={form.fssai_license}
                  onChange={e => setForm(p => ({ ...p, fssai_license: e.target.value }))} maxLength={14} />
              </div>
              <div className="space-y-2">
                <Label>GST Number <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input placeholder="22AAAAA0000A1Z5" value={form.gst_number}
                  onChange={e => setForm(p => ({ ...p, gst_number: e.target.value.toUpperCase() }))} maxLength={15} />
              </div>
            </div>
          ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>FSSAI License / Registration No. <span className="text-destructive">*</span></Label>
              <Input placeholder="14-digit FSSAI number" value={form.fssai_license}
                onChange={e => setForm(p => ({ ...p, fssai_license: e.target.value }))} required maxLength={14} />
            </div>
            <div className="space-y-2">
              <Label>GST Number <span className="text-muted-foreground text-xs">(Optional)</span></Label>
              <Input placeholder="22AAAAA0000A1Z5" value={form.gst_number}
                onChange={e => setForm(p => ({ ...p, gst_number: e.target.value.toUpperCase() }))} maxLength={15} />
            </div>
          </div>
          )}
          <div className="space-y-2">
            <Label>University / College Name {merchantType === 'canteen'
              ? <span className="text-destructive">*</span>
              : <span className="text-muted-foreground text-xs">(Optional — shown with name if set)</span>}</Label>
            <Input placeholder="e.g., IIT Delhi" value={form.university_name}
              onChange={e => setForm(p => ({ ...p, university_name: e.target.value }))} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Opening Time <span className="text-destructive">*</span></Label>
              <Input type="time" value={form.opening_hours}
                onChange={e => setForm(p => ({ ...p, opening_hours: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Closing Time <span className="text-destructive">*</span></Label>
              <Input type="time" value={form.closing_hours}
                onChange={e => setForm(p => ({ ...p, closing_hours: e.target.value }))} required />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={onBack} className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground rounded-xl px-8"
              disabled={saveRestaurant.isPending}>
              {saveRestaurant.isPending ? 'Saving...' : 'Save & Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function BankDetailsStep({ restaurantId, onNext, onBack }: { restaurantId: string; onNext: () => void; onBack: () => void }) {
  const { data: bankDetails, isLoading } = useBankDetails(restaurantId);
  const saveBankDetails = useSaveBankDetails();
  const submitForVerification = useSubmitForVerification();

  const [form, setForm] = useState({
    account_holder_name: '', account_number: '', ifsc_code: '', bank_name: '', upi_id: '',
  });

  useEffect(() => {
    if (bankDetails) {
      setForm({
        account_holder_name: bankDetails.account_holder_name || '',
        account_number: bankDetails.account_number || '',
        ifsc_code: bankDetails.ifsc_code || '',
        bank_name: bankDetails.bank_name || '',
        upi_id: bankDetails.upi_id || '',
      });
    }
  }, [bankDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.account_holder_name.trim() || !form.account_number.trim() || !form.ifsc_code.trim() || !form.bank_name.trim()) return;
    await saveBankDetails.mutateAsync({ restaurantId, details: form });
    await submitForVerification.mutateAsync(restaurantId);
    onNext();
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Card className="rounded-2xl border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          Bank Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">Where should we send your earnings?</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Account Holder Name <span className="text-destructive">*</span></Label>
              <Input placeholder="As per bank records" value={form.account_holder_name}
                onChange={e => setForm(p => ({ ...p, account_holder_name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Bank Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g., State Bank of India" value={form.bank_name}
                onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} required />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Account Number <span className="text-destructive">*</span></Label>
              <Input placeholder="Account number" value={form.account_number}
                onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>IFSC Code <span className="text-destructive">*</span></Label>
              <Input placeholder="SBIN0001234" value={form.ifsc_code}
                onChange={e => setForm(p => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))} maxLength={11} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>UPI ID <span className="text-muted-foreground text-xs">(Optional)</span></Label>
            <Input placeholder="yourname@upi" value={form.upi_id}
              onChange={e => setForm(p => ({ ...p, upi_id: e.target.value }))} />
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={onBack} className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground rounded-xl px-8"
              disabled={saveBankDetails.isPending || submitForVerification.isPending}>
              {saveBankDetails.isPending || submitForVerification.isPending ? 'Submitting...' : 'Submit for Verification'}
              <ShieldCheck className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function VerificationPendingScreen({ status, onResubmit }: { status: string; onResubmit: () => void }) {
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center py-12 px-4"
    >
      {isPending ? (
        <>
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse-soft">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-3">Verification in Progress</h2>
          <p className="text-muted-foreground max-w-md mb-2">
            Your restaurant application has been submitted successfully! Our team is reviewing your details.
          </p>
          <p className="text-sm text-muted-foreground max-w-md mb-8">
            You'll receive a notification once your restaurant is verified. This usually takes 24-48 hours.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-sm">
              <span className="text-primary font-semibold">✓</span> Owner Profile
            </div>
            <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-sm">
              <span className="text-primary font-semibold">✓</span> Restaurant Details
            </div>
            <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-sm">
              <span className="text-primary font-semibold">✓</span> Bank Details
            </div>
          </div>
        </>
      ) : isRejected ? (
        <>
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-3">Application Rejected</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Unfortunately, your application was not approved. Please review your details and resubmit.
          </p>
          <Button onClick={onResubmit} className="gradient-primary text-primary-foreground rounded-xl px-8">
            <RefreshCw className="w-4 h-4 mr-2" />
            Review & Resubmit
          </Button>
        </>
      ) : null}
    </motion.div>
  );
}

export default function RestaurantOnboarding() {
  const { data: restaurant, isLoading: loadingRestaurant } = useMyRestaurantFull();
  const { data: ownerDetails, isLoading: loadingOwner } = useOwnerDetails();
  const navigate = useNavigate();

  // Calculate initial step based on existing data
  const getInitialStep = () => {
    if (!ownerDetails) return 0;
    if (!restaurant) return 1;
    const status = restaurant.verification_status;
    if (status === 'pending') return 3;
    if (status === 'rejected') return 3;
    if (status === 'verified') return 3;
    // draft — check if bank details step needed
    return 2;
  };

  const [step, setStep] = useState<number | null>(null);
  const [merchantType, setMerchantType] = useState<MerchantType | null>(
    () => (localStorage.getItem(MT_KEY) as MerchantType | null) || null,
  );
  const effectiveType = (restaurant?.merchant_type as MerchantType | undefined) || merchantType;
  const chooseType = (t: MerchantType) => { localStorage.setItem(MT_KEY, t); setMerchantType(t); };

  useEffect(() => {
    if (!loadingRestaurant && !loadingOwner) {
      if (restaurant?.verification_status === 'verified') {
        navigate('/restaurant', { replace: true });
        return;
      }
      setStep(getInitialStep());
    }
  }, [loadingRestaurant, loadingOwner, restaurant, ownerDetails]);

  if (loadingRestaurant || loadingOwner || step === null) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const verificationStatus = restaurant?.verification_status || 'draft';
  const showVerification = step === 3 && (verificationStatus === 'pending' || verificationStatus === 'rejected');

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold">Merchant Onboarding</h1>
          <p className="text-muted-foreground">Complete all steps to get your business listed</p>
        </div>

        {!effectiveType ? <MerchantTypeStep onSelect={chooseType} /> : (<>
        <StepIndicator current={step} steps={STEPS} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && <OwnerProfileStep onNext={() => setStep(1)} />}
            {step === 1 && <RestaurantDetailsStep merchantType={effectiveType!} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
            {step === 2 && restaurant && (
              <BankDetailsStep restaurantId={restaurant.id} onNext={() => setStep(3)} onBack={() => setStep(1)} />
            )}
            {step === 2 && !restaurant && (
              <RestaurantDetailsStep merchantType={effectiveType!} onNext={() => setStep(2)} onBack={() => setStep(0)} />
            )}
            {showVerification && (
              <VerificationPendingScreen status={verificationStatus} onResubmit={() => setStep(0)} />
            )}
            {step === 3 && verificationStatus === 'draft' && (
              <VerificationPendingScreen status="pending" onResubmit={() => setStep(0)} />
            )}
          </motion.div>
        </AnimatePresence>
        </>)}
      </div>
    </DashboardLayout>
  );
}
