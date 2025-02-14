interface OverviewCardProps {
  icon: string;
  title: string;
  links: Array<{
    href: string;
    text: string;
  }>;
}

function OverviewCard({ icon, title, links }: OverviewCardProps) {
  return (
    <div className="p-4 rounded-lg bg-base-100 border border-base-300">
      <h3 className="text-xl font-semibold mb-2">{icon} {title}</h3>
      <p className="text-sm mb-2">Master {title.toLowerCase()} through:</p>
      <ul className="list-disc list-inside text-sm">
        {links.map((link, index) => (
          <li key={index}>
            <a href={link.href} className="hover:text-primary">
              {link.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LearningOverview() {
  const overviewCards = [
    {
      icon: "📊",
      title: "Business Analytics",
      links: [
        { href: "#phase-1", text: "Phase 1: Python & Data Science" },
        { href: "#phase-2", text: "Phase 2: Predictive Modeling" },
        { href: "#phase-4-2", text: "Phase 4.2: MLOps & Deployment" }
      ]
    },
    {
      icon: "🎨",
      title: "Generate AI Art",
      links: [
        { href: "#phase-2-2", text: "Phase 2.2: CNN Architectures" },
        { href: "#phase-3-2", text: "Phase 3.2: Generative AI Models" },
        { href: "#phase-4-1", text: "Phase 4.1: Deployment & Optimization" }
      ]
    },
    {
      icon: "🤖",
      title: "Train AI Models",
      links: [
        { href: "#phase-2", text: "Phase 2: Deep Learning Fundamentals" },
        { href: "#phase-3", text: "Phase 3: Advanced Architectures" },
        { href: "#phase-4", text: "Phase 4: Model Deployment" }
      ]
    },
    {
      icon: "🔬",
      title: "Research & Learning",
      links: [
        { href: "#phase-3", text: "Phase 3: Advanced Architectures" },
        { href: "#phase-4-3", text: "Phase 4.3: Project Portfolio" },
        { href: "#ongoing-learning", text: "Ongoing Learning Resources" }
      ]
    }
  ];

  return (
    <div className="mb-12 p-6 bg-base-200 rounded-lg border border-base-300">
      <h2 className="text-2xl font-bold mb-4">Real World Use Cases</h2>
      <p className="mb-6">These sections of the learning path apply to some of the more common use cases for GPUs:</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        {overviewCards.map((card, index) => (
          <OverviewCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
} 