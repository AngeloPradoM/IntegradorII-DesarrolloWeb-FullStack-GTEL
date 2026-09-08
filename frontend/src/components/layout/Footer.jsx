export default function Footer() {
	return (
		<footer className="mt-16 bg-white border-t">
			<div className="max-w-7xl mx-auto px-6 py-6 text-sm text-center text-brand-gray">
				© {new Date().getFullYear()} Portal Empleos. Todos los derechos reservados.
			</div>
		</footer>
	);
}
