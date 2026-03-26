import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Subscribe.css";
import {
  BarChart3,
  Bell,
  Check,
  CreditCard,
  HandHeart,
  LayoutDashboard,
  Lock,
  Settings,
  Timer,
  Trophy,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../utils/api";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Scores", to: "/scores", icon: BarChart3 },
  { label: "Charity", to: "/charity", icon: HandHeart },
  { label: "Draws", to: "/draws", icon: Timer },
  { label: "Winnings", to: "/winnings", icon: Trophy },
  { label: "Subscription", to: "/subscribe", icon: CreditCard },
];

const PLANS = {
  monthly: {
    name: "Monthly Amateur",
    price: 29,
    amount: 2900,
    period: "monthly",
    badge: null,
    features: [
      "5 Score entries per month",
      "Monthly prize draw entry",
      "Charity contribution (10%)",
      "Performance tracking",
      "Email notifications",
    ],
  },
  yearly: {
    name: "Annual Professional",
    price: 249,
    amount: 24900,
    period: "yearly",
    badge: "MOST IMPACTFUL",
    features: [
      "Everything in Monthly",
      "2x draw entries per month",
      "Priority charity matching",
      "Advanced analytics",
      "Winner verification priority",
      "Dedicated support",
    ],
  },
};

function prettyDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function normalizeSubscription(raw) {
  if (!raw) return null;
  if (raw.data && !Array.isArray(raw.data)) return raw.data;
  if (raw.subscription && !Array.isArray(raw.subscription)) return raw.subscription;
  return raw;
}

export default function Subscribe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [toast, setToast] = useState("");
  const isDevelopment = import.meta.env.MODE === "development";

  const fetchSubscription = async () => {
    try {
      const response = await api.get("/api/subscriptions/me");
      setSubscription(normalizeSubscription(response.data));
    } catch {
      setSubscription(null);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/subscriptions/me");
        if (!alive) return;
        setSubscription(normalizeSubscription(response.data));
      } catch {
        if (!alive) return;
        setSubscription(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const activePlan = useMemo(() => {
    if (!subscription) return null;
    const status = (subscription.status ?? "").toString().toLowerCase();
    if (status && status !== "active") return null;
    const plan = (subscription.plan ?? subscription.period ?? "").toString().toLowerCase();
    return plan === "yearly" ? "yearly" : plan === "monthly" ? "monthly" : null;
  }, [subscription]);

  const renewDate = subscription?.ends_at ?? subscription?.endsAt ?? subscription?.next_billing_date;

  const startPayment = async (planKey) => {
    if (processing || loading) return;

    setProcessing(true);
    setProcessingPlan(planKey);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!window.Razorpay) {
        throw new Error("Payment gateway unavailable. Please refresh and try again.");
      }

      const plan = PLANS[planKey];
      const orderResponse = await api.post("/api/payment/create-order", {
        amount: plan.amount,
        plan: planKey,
      });

      const orderPayload = orderResponse.data?.data ?? orderResponse.data ?? {};

      if (!orderPayload.orderId || !orderPayload.amount || !orderPayload.keyId) {
        throw new Error("Unable to initialize payment. Please try again.");
      }

      const razorpay = new window.Razorpay({
        key: orderPayload.keyId,
        amount: orderPayload.amount,
        currency: orderPayload.currency || "INR",
        name: "KineticAltruist",
        description: plan.name,
        order_id: orderPayload.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#7c3aed",
        },
        handler: async (paymentResult) => {
          try {
            const verifyResponse = await api.post("/api/payment/verify", {
              razorpay_payment_id: paymentResult.razorpay_payment_id,
              razorpay_order_id: paymentResult.razorpay_order_id,
              razorpay_signature: paymentResult.razorpay_signature,
              plan: planKey,
            });

            const verified = verifyResponse.data?.success ?? verifyResponse.data?.data?.success ?? true;
            if (!verified) {
              throw new Error("Payment verification failed. Contact support.");
            }

            await api.post("/api/subscriptions/create", {
              plan: planKey,
              amount: plan.price,
              razorpay_order_id: paymentResult.razorpay_order_id,
              razorpay_payment_id: paymentResult.razorpay_payment_id,
            });

            setSuccessMessage("Subscription activated successfully!");
            setToast("Subscription activated successfully!");
            await fetchSubscription();
          } catch {
            setErrorMessage("Payment verification failed. Contact support.");
          } finally {
            setProcessing(false);
            setProcessingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setProcessingPlan(null);
            setErrorMessage("Payment was cancelled. Please try again.");
          },
        },
      });

      razorpay.on("payment.failed", () => {
        setProcessing(false);
        setProcessingPlan(null);
        setErrorMessage("Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (error) {
      setProcessing(false);
      setProcessingPlan(null);
      setErrorMessage(error?.response?.data?.error || error?.message || "Payment failed. Please try again.");
    }
  };

  const startMockPayment = async (planKey) => {
    if (!isDevelopment || processing || loading) return;

    setProcessing(true);
    setProcessingPlan(`${planKey}-test`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const plan = PLANS[planKey];
      const mockResponse = await api.post('/api/payment/mock-success', { plan: planKey });
      const mockData = mockResponse.data?.data ?? {};

      if (!mockData.verified || !mockData.razorpay_order_id || !mockData.razorpay_payment_id) {
        throw new Error('Mock payment verification failed.');
      }

      await api.post('/api/subscriptions/create', {
        plan: planKey,
        amount: plan.price,
        razorpay_order_id: mockData.razorpay_order_id,
        razorpay_payment_id: mockData.razorpay_payment_id,
      });

      setSuccessMessage('Subscription activated! (Test Mode)');
      setToast('Subscription activated! (Test Mode)');
      await fetchSubscription();
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || error?.message || 'Test payment failed. Please try again.');
    } finally {
      setProcessing(false);
      setProcessingPlan(null);
    }
  };

  const monthlyCurrent = activePlan === "monthly";
  const yearlyCurrent = activePlan === "yearly";

  const monthlyLabel = monthlyCurrent ? "Current Plan" : yearlyCurrent ? "Switch to Monthly" : "Get Started";
  const yearlyLabel = yearlyCurrent ? "Current Plan" : monthlyCurrent ? "Upgrade to Professional" : "Start Annual Pro";

  return (
    <div className="sub-page">
{toast ? <div className="sub-toast">{toast}</div> : null}

      <div className="sub-layout">
        <aside className="sub-sidebar">
          <p className="sub-brand">Kinetic Altruist</p>
          <nav className="sub-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link key={`${item.label}-${item.to}`} to={item.to} className={`sub-nav-link ${active ? "active" : ""}`}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sub-side-foot">
            <div className="sub-side-member">
              <img
                className="sub-side-avatar"
                src={"https://picsum.photos/seed/kinetic-member/60/60"}
                alt="Premium member"
              />
              <div>
                <p className="sub-side-name">Premium Member</p>
                <p className="sub-side-tier">Elite Tier</p>
              </div>
            </div>
            <button className="sub-side-upgrade" type="button" onClick={() => navigate("/subscribe")}>Upgrade Now</button>
          </div>
        </aside>

        <main className="sub-main">
          <nav className="sub-mobile-nav" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link key={`mobile-${item.label}-${item.to}`} to={item.to} className={`sub-mobile-link ${active ? "active" : ""}`}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sub-topbar">
            <div className="sub-top-actions">
              <Bell size={14} />
              <UserCircle2 size={15} />
            </div>
          </div>

          {!loading && activePlan ? (
            <div className="sub-banner">
              <div className="sub-banner-left">
                <span className="sub-banner-icon">
                  <Check size={15} />
                </span>
                <div>
                  <p className="sub-banner-title">
                    You are currently on the <strong>{activePlan === "monthly" ? PLANS.monthly.name : PLANS.yearly.name}</strong> plan.
                  </p>
                  <p className="sub-banner-sub">Renews on {prettyDate(renewDate)}.</p>
                </div>
              </div>
              <span className="sub-banner-link">Manage Billing</span>
            </div>
          ) : null}

          <div className="sub-heading">
            <h1>Performance Tiers</h1>
            <p>Join thousands of golfers making an impact</p>
          </div>

          <section className="sub-cards">
            <article className="sub-card">
              <h2>{PLANS.monthly.name}</h2>
              <p className="sub-price">${PLANS.monthly.price}<small>/mo</small></p>

              <ul className="sub-features">
                {PLANS.monthly.features.map((feature) => (
                  <li key={feature}>
                    <Check size={14} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={processing || loading || monthlyCurrent}
                className={`sub-button ${monthlyCurrent || yearlyCurrent ? "sub-button-outline" : ""}`}
                onClick={() => startPayment("monthly")}
              >
                {processing && processingPlan === "monthly" ? <span className="sub-spinner" /> : null}
                {monthlyLabel}
              </button>
              {isDevelopment ? (
                <button
                  type="button"
                  className="sub-test-button"
                  disabled={processing || loading || monthlyCurrent}
                  onClick={() => startMockPayment("monthly")}
                >
                  {processing && processingPlan === "monthly-test" ? <span className="sub-spinner" /> : null}
                  Simulate Payment (Test Mode)
                </button>
              ) : null}
            </article>

            <article className="sub-card cta">
              {PLANS.yearly.badge ? <span className="sub-badge">{PLANS.yearly.badge}</span> : null}
              <h2>{PLANS.yearly.name}</h2>
              <p className="sub-price">${PLANS.yearly.price}<small>/yr</small></p>
              <p className="sub-save">Save $99</p>

              <ul className="sub-features">
                {PLANS.yearly.features.map((feature) => (
                  <li key={feature}>
                    <Check size={14} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={processing || loading || yearlyCurrent}
                className={`sub-button ${yearlyCurrent ? "sub-button-outline" : ""}`}
                onClick={() => startPayment("yearly")}
              >
                {processing && processingPlan === "yearly" ? <span className="sub-spinner" /> : null}
                {yearlyLabel}
              </button>
              {isDevelopment ? (
                <button
                  type="button"
                  className="sub-test-button"
                  disabled={processing || loading || yearlyCurrent}
                  onClick={() => startMockPayment("yearly")}
                >
                  {processing && processingPlan === "yearly-test" ? <span className="sub-spinner" /> : null}
                  Simulate Payment (Test Mode)
                </button>
              ) : null}
            </article>
          </section>

          {errorMessage ? <div className="sub-status error">{errorMessage}</div> : null}
          {successMessage ? <div className="sub-status success">{successMessage}</div> : null}

          <div className="sub-security">
            <span><Lock size={12} /> Secure Payment</span>
            <span><Lock size={12} /> PCI Compliant</span>
          </div>

          <p className="sub-footer">
            All transactions are processed through encrypted channels. Kinetic Altruist does not store full credit card information.
            For corporate licensing or foundation grants, please contact our executive philanthropy team directly.
          </p>
        </main>
      </div>
    </div>
  );
}
