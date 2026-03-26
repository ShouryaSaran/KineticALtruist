import { Link } from "react-router-dom";
import "../../../styles/Home.css";
import "../../../styles/Navbar.css";

const navLinks = [
	{ label: "How it Works", target: "how-it-works" },
	{ label: "Features", target: "features" },
	{ label: "Prizes", target: "prizes" },
	{ label: "Charity", target: "charity" },
	{ label: "Pricing", target: "pricing" },
];

const stats = [
	{ value: "$2.4M+", label: "Total Prize Pool" },
	{ value: "15k+", label: "Active Donors" },
	{ value: "$850k", label: "Charity Impact" },
	{ value: "98%", label: "User Satisfaction" },
];

const impactCards = [
	{
		icon: "S",
		title: "1. Enter Scores",
		text: "Log your monthly rounds through our precision dashboard. Every stroke tracked builds your performance profile.",
	},
	{
		icon: "D",
		title: "2. Join Draws",
		text: "Subscription activates your entry into monthly prize pools. Your consistency and skill level determine your winning tier.",
	},
	{
		icon: "C",
		title: "3. Win & Support",
		text: "Win premium rewards while a guaranteed percentage of your subscription flows directly to your chosen charities.",
	},
];

const featureBullets = [
	{
		icon: "T",
		title: "Smart Score Tracking",
		text: "Advanced analytics that calculate your handicap-updated performance across any course globally.",
	},
	{
		icon: "P",
		title: "Monthly Prize Engine",
		text: "Automated selection systems ensuring fair and transparent distribution at high-value rewards.",
	},
	{
		icon: "H",
		title: "Charity Ecosystem",
		text: "Choose from 500+ verified non-profits. Track exactly how much your subscription contributes.",
	},
];

const priceFeatures = {
	monthly: [
		"1 Monthly Jackpot Entry",
		"Standard Score Analytics",
		"10% Subscription Donation",
		"Basic Impact Dashboard",
	],
	annual: [
		"3 Monthly Jackpot Entries",
		"Advanced AI Analytics",
		"20% Subscription Donation",
		"Priority Prize Processing",
		"Premium Partner Access",
	],
};

function Navbar() {
	return (
		<header className="ka-navbar">
			<div className="ka-brand">KineticAltruist</div>
			<nav className="ka-nav-links">
				{navLinks.map((link) => (
					<a href={`#${link.target}`} key={link.target}>
						{link.label}
					</a>
				))}
			</nav>
			<div className="ka-nav-buttons">
				<Link to="/login" className="ka-btn ka-btn-ghost">
					Login
				</Link>
				<Link to="/signup" className="ka-btn ka-btn-primary">
					Sign Up
				</Link>
			</div>
		</header>
	);
}

function HeroSection() {
	return (
		<section className="ka-hero">
			<div className="ka-hero-left">
				<span className="ka-pill">PERFORMANCE PHILANTHROPY</span>
				<h1>
					Play. Win.
					<span>Give Back.</span>
				</h1>
				<p>
					Track your golf performance, win monthly prizes, and support a charity you care
					about.
				</p>
				<div className="ka-hero-actions">
				<Link to="/signup" className="ka-btn ka-btn-primary">
					Start Subscription -&gt;
				</Link>
					<button className="ka-btn ka-btn-ghost" type="button">
						View Live Prizes
					</button>
				</div>
				<div className="ka-social-proof">
					<div className="ka-avatar-stack" aria-hidden="true">
						<img src="https://picsum.photos/seed/golfer1/80/80" alt="" />
						<img src="https://picsum.photos/seed/golfer2/80/80" alt="" />
						<img src="https://picsum.photos/seed/golfer3/80/80" alt="" />
					</div>
					<span>
						<strong>1,200+</strong> Golfers joined this month
					</span>
				</div>
			</div>
			<div className="ka-performance-card-wrap">
				<article className="ka-performance-card">
					<div className="ka-performance-head">
						<div>
							<h3>Monthly Performance</h3>
							<p>Target: Par 72 | Avg: 182</p>
						</div>
						<span className="ka-mini-pill">+12% Impact</span>
					</div>
					<div className="ka-chart" aria-hidden="true">
						<div className="bar" />
						<div className="bar" />
						<div className="bar active" />
						<div className="bar" />
						<div className="bar" />
						<div className="bar" />
					</div>
					<div className="ka-performance-footer">
						<div>
							<p>Next Prize Draw</p>
							<strong>14:22:05</strong>
						</div>
						<div>
							<p>Total Donated</p>
							<strong>$14,295</strong>
						</div>
					</div>
				</article>
			</div>
		</section>
	);
}

function StatsBar() {
	return (
		<section className="ka-stats-bar">
			{stats.map((item) => (
				<article key={item.label}>
					<h3>{item.value}</h3>
					<p>{item.label}</p>
				</article>
			))}
		</section>
	);
}

function HowItWorksSection() {
	return (
		<section className="ka-section" id="how-it-works">
			<div className="ka-section-heading">
				<h2>Engineered for Impact</h2>
				<p>
					Our three-step process bridges the gap between your passion for the game and global
					philanthropy needs.
				</p>
			</div>
			<div className="ka-grid-3">
				{impactCards.map((card) => (
					<article className="ka-card" key={card.title}>
						<span className="ka-card-icon">{card.icon}</span>
						<h3>{card.title}</h3>
						<p>{card.text}</p>
					</article>
				))}
			</div>
		</section>
	);
}

function BuiltForPerformanceSection() {
	return (
		<section className="ka-performance-section" id="features">
			<div>
				<h2>Built for Performance</h2>
				<p>
					We replaced outdated systems with a modern performance framework focused on excellence
					and generosity.
				</p>
				<div className="ka-bullets">
					{featureBullets.map((bullet) => (
						<article className="ka-bullet" key={bullet.title}>
							<span>{bullet.icon}</span>
							<div>
								<h3>{bullet.title}</h3>
								<p>{bullet.text}</p>
							</div>
						</article>
					))}
				</div>
			</div>

			<div className="ka-jackpot-wrap" id="prizes">
				<article className="ka-jackpot-card">
					<p className="ka-eyebrow">THE JACKPOT</p>
					<p className="ka-jackpot-sub">Current Rollover Pool</p>
					<h3>$42,500</h3>
					<div className="ka-jackpot-row highlight">
						<span>5 Match Payout</span>
						<strong>$72,500</strong>
					</div>
					<div className="ka-jackpot-row">
						<span>4 Match Payout</span>
						<strong>$2,580</strong>
					</div>
					<div className="ka-jackpot-row">
						<span>3 Match Payout</span>
						<strong>$580</strong>
					</div>
				</article>
			</div>
		</section>
	);
}

function CharitySection() {
	return (
		<section className="ka-charity" id="charity">
			<div className="ka-charity-image-wrap">
				<img
					src="https://picsum.photos/seed/charity-team/900/600"
					alt="Group of volunteers"
				/>
				<div className="ka-image-overlay">
					<h3>Ocean Clean-Up Project</h3>
					<p>
						Defending coastal ecosystems with verified organizations around the world.
					</p>
				</div>
			</div>

			<div className="ka-charity-content">
				<h2>Your Game, Your Cause</h2>
				<p>
					Unlike traditional platforms, KineticAltruist lets you decide where your impact goes.
					Use our selector to split your contribution across multiple global causes.
				</p>

				<div className="ka-split-card">
					<div className="ka-split-head">
						<span>Selected Donation Split</span>
						<strong>10% of Subscription</strong>
					</div>
					<div className="ka-slider" aria-hidden="true">
						<div className="ka-slider-fill" />
					</div>
					<div className="ka-tags">
						<span>Education</span>
						<span>Environment</span>
						<span>Healthcare</span>
					</div>
				</div>

				<button className="ka-btn ka-btn-outline" type="button">
					Explore All 500+ Charities
				</button>
			</div>
		</section>
	);
}

function PricingSection() {
	return (
		<section className="ka-pricing" id="pricing">
			<div className="ka-section-heading ka-section-heading-light">
				<h2>Performance Tiers</h2>
				<p>
					Choose the level of impact and reward entry that fits your lifestyle. Cancel anytime.
				</p>
			</div>

			<div className="ka-pricing-grid">
				<article className="ka-price-card">
					<h3>Monthly Amateur</h3>
					<p className="ka-price">
						$29 <span>/month</span>
					</p>
					<ul>
						{priceFeatures.monthly.map((feature) => (
							<li key={feature}>{feature}</li>
						))}
					</ul>
					<button className="ka-btn ka-btn-dark-outline" type="button">
						Get Started
					</button>
				</article>

				<article className="ka-price-card ka-price-card-highlight">
					<span className="ka-highlight-pill">MOST IMPACTFUL</span>
					<h3>Annual Professional</h3>
					<p className="ka-price">
						$249 <span>/year</span>
					</p>
					<ul>
						{priceFeatures.annual.map((feature) => (
							<li key={feature}>{feature}</li>
						))}
					</ul>
					<button className="ka-btn ka-btn-light" type="button">
						Start Annual Pro
					</button>
				</article>
			</div>
		</section>
	);
}

function FinalCtaSection() {
	return (
		<section className="ka-final-cta">
			<h2>
				Ready to transform your
				<span> game into impact?</span>
			</h2>
			<p>Join the 15,000+ golfers redefining what it means to play well and do good.</p>
			<button className="ka-btn ka-btn-primary" type="button">
				Join the Kinetic Network
			</button>
			<small>No hidden fees. 100% transparent prize pools.</small>
		</section>
	);
}

function Footer() {
	return (
		<footer className="ka-footer">
			<p>KineticAltruist</p>
			<nav>
				{[
					"How it Works",
					"Features",
					"Prizes",
					"Charity",
					"Privacy Policy",
					"Terms of Service",
				].map((item) => (
					<a href="#" key={item}>
						{item}
					</a>
				))}
			</nav>
			<p>Copyright 2026 Kinetic Altruist. High-Performance Philanthropy.</p>
		</footer>
	);
}

export default function Home() {
	return (
		<main className="ka-page">
			<Navbar />
			<HeroSection />
			<StatsBar />
			<HowItWorksSection />
			<BuiltForPerformanceSection />
			<CharitySection />
			<PricingSection />
			<FinalCtaSection />
			<Footer />
		</main>
	);
}
