import { Link } from "react-router-dom";

export default function Header() {
	return (
		<header className="bg-white shadow-sm">
			<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
				<Link to="/" className="text-xl font-bold text-brand-navy">
					Portal Empleos
				</Link>

				<nav className="flex items-center gap-4">
					<Link to="/ofertas" className="text-sm text-brand-gray hover:text-brand-navy">
						Ofertas
					</Link>
					<a href="#" className="text-sm text-brand-gray hover:text-brand-navy">
						Empresas
					</a>
				</nav>
			</div>
		</header>
	);
}
