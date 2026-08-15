import Link from "next/link";

export default function Home() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">VINIX</div>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/stock">Stock</Link>
        </nav>
      </aside>

      <main className="main">
        <div className="eyebrow">Vehicle Intelligence & Inventory System</div>
        <h1>Dashboard</h1>

        <section className="cards">
          <div className="card">
            <div className="card-label">Vehicles in stock</div>
            <div className="card-value">0</div>
          </div>
          <div className="card">
            <div className="card-label">Capital invested</div>
            <div className="card-value">€0</div>
          </div>
          <div className="card">
            <div className="card-label">Expected sales value</div>
            <div className="card-value">€0</div>
          </div>
          <div className="card">
            <div className="card-label">Expected gross profit</div>
            <div className="card-value">€0</div>
          </div>
        </section>
      </main>
    </div>
  );
}
