import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Hero from "../../components/sections/Hero";
import InfoCards from "../../components/sections/InfoCards";

export default function LandingPage() {
	return (
		<div className="font-sans">
			<Header />
			<main className="max-w-7xl mx-auto px-6 py-10">
				<Hero />
				<section className="mt-10">
					<InfoCards />
				</section>
			</main>
			<Footer />
		</div>
	);
}
