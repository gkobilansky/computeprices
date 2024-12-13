import GPUComparisonTable from '@/components/GPUComparisonTable';
import ProviderFilters from '@/components/ProviderFilters';

export default function Home() {
  return (
    <div>
      <main className="min-h-screen p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Cloud GPU Price Comparison</h1>
          <p className="text-gray-600 mt-2">Find the most cost-effective GPU for your ML workload</p>
        </header>

        <ProviderFilters />
        <GPUComparisonTable />
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p>Built with 🦾 by <a href="https://lansky.tech" target="_blank" rel="noopener noreferrer">Lansky Tech</a></p>
        <p>Data updated every 24 hours</p>
      </footer>
    </div>

  );
}
