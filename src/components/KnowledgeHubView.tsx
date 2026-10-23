import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Layers,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  X,
} from 'lucide-react';

type EcosystemCompany = {
  id: string;
  name: string;
  category: string;
  summary: string;
  capabilities: string[];
  audience: string;
};

const GROUP_WEBSITE = 'https://www.estusciagroup.com/';

const ecosystemCompanies: EcosystemCompany[] = [
  {
    id: 'group',
    name: 'Estuscia Group',
    category: 'Parent Ecosystem & Corporate Governance',
    summary:
      'The parent ecosystem aligning group strategy, governance, cross-company collaboration, and long-term venture development.',
    capabilities: [
      'Group strategy and corporate governance',
      'Cross-company collaboration and shared resources',
      'Executive advisory and institutional relationships',
      'Venture development and expansion',
    ],
    audience: 'All staff, partners, founders, and business users',
  },
  {
    id: 'capital',
    name: 'Estuscia Capital',
    category: 'Financial Services & Advisory',
    summary:
      'A financial-services vertical focused on financial structuring, debt and equity advisory, venture funding, and growth strategies.',
    capabilities: [
      'Financial and capital structuring',
      'Debt and equity advisory',
      'Investment due diligence and risk review',
      'Growth and funding strategy',
    ],
    audience: 'Business users, founders, and teams working on financial services',
  },
  {
    id: 'froi',
    name: 'Froi Studio',
    category: 'Creative, Design & Media',
    summary:
      'A creative studio supporting brand identity, digital product design, visual communication, and storytelling.',
    capabilities: [
      'Corporate brand identity',
      'Digital UI/UX and product design',
      'Creative production and media',
      'Brand storytelling',
    ],
    audience: 'Teams working on branding, design, marketing, and communications',
  },
  {
    id: 'estivoxx',
    name: 'Estivoxx Technologies',
    category: 'Technology & Digital Transformation',
    summary:
      'The technology vertical building custom software, enterprise platforms, AI-enabled solutions, cloud infrastructure, and automated workflows.',
    capabilities: [
      'Custom web and enterprise software',
      'AI integration and process automation',
      'Cloud infrastructure and digital platforms',
      'Workflow and business-system development',
    ],
    audience: 'Staff, technology teams, business users, and clients seeking digital solutions',
  },
  {
    id: 'zedeo',
    name: 'Zedeo Cart',
    category: 'E-commerce & Digital Commerce',
    summary:
      'An e-commerce vertical focused on digital storefronts, merchant enablement, payment integrations, inventory, and commerce operations.',
    capabilities: [
      'Digital storefronts and commerce experiences',
      'Payment integration',
      'Inventory and merchant operations',
      'Online business growth',
    ],
    audience: 'Commerce teams, merchants, and e-commerce business users',
  },
  {
    id: 'animalo',
    name: 'Animalo Fashion',
    category: 'Fashion & Apparel',
    summary:
      'An apparel brand focused on contemporary fashion, garment development, and retail opportunities.',
    capabilities: [
      'Apparel and product development',
      'Fashion brand building',
      'Garment production and sourcing',
      'Retail and distribution opportunities',
    ],
    audience: 'Fashion, product, sourcing, and retail teams',
  },
  {
    id: 'global',
    name: 'Estuscia Global',
    category: 'Global Trade & Commerce',
    summary:
      'The global-trade vertical supporting cross-border commerce, distribution, supply-chain coordination, and trade operations.',
    capabilities: [
      'Cross-border trade and distribution',
      'Supply-chain coordination',
      'Trade and logistics support',
      'International market opportunities',
    ],
    audience: 'Trade teams, exporters, importers, and business users',
  },
  {
    id: 'chai',
    name: 'Chai with Trade',
    category: 'B2B Trade Networking',
    summary:
      'A business-to-business networking platform intended to connect traders, exporters, manufacturers, and corporate buyers.',
    capabilities: [
      'B2B networking',
      'Trade connections and introductions',
      'Business insights and knowledge sharing',
      'Relationship building across markets',
    ],
    audience: 'Traders, manufacturers, exporters, and corporate buyers',
  },
  {
    id: 'maqcala',
    name: 'MaQcala Perfumes',
    category: 'Fragrance & Luxury Retail',
    summary:
      'A fragrance and luxury-retail vertical focused on perfume products, scent identity, and premium customer experiences.',
    capabilities: [
      'Fragrance and perfume products',
      'Product and brand identity',
      'Premium retail experiences',
      'Beauty and fragrance distribution',
    ],
    audience: 'Product, retail, brand, and customer-facing teams',
  },
];

const learningTopics = [
  {
    title: 'Understanding the Estuscia Group Ecosystem',
    category: 'Getting Started',
    summary:
      'Learn how the parent group and its nine ecosystem firms fit together, what each business focuses on, and where to find official information.',
    points: [
      'Estuscia Group coordinates the wider ecosystem and group strategy.',
      'Each ecosystem firm has its own business focus and audience.',
      'Use the official website for the latest public-facing company information.',
    ],
  },
  {
    title: 'How Teams Work Across the Ecosystem',
    category: 'Ways of Working',
    summary:
      'Understand why clear communication, ownership, governance, and coordination matter when teams support different businesses within one group.',
    points: [
      'Confirm the relevant company and business owner before starting cross-company work.',
      'Share only information that is appropriate for the recipient and their role.',
      'Record decisions and follow the applicable internal process.',
    ],
  },
  {
    title: 'Using the EMS Staff Portal',
    category: 'EMS & Operations',
    summary:
      'A general introduction to the EMS areas used for attendance, staff information, payroll, company details, and role-based access.',
    points: [
      'Use only the modules available to your assigned role.',
      'Keep attendance and employee information accurate.',
      'Contact your administrator if access or employee details appear incorrect.',
    ],
  },
  {
    title: 'Company Information and Professional Conduct',
    category: 'Policies & Governance',
    summary:
      'A practical reminder to represent the group accurately, protect company information, and use approved sources when answering questions.',
    points: [
      'Refer to official company information rather than assumptions.',
      'Do not share confidential employee, customer, financial, or operational data.',
      'Escalate requests that require approval or access you do not have.',
    ],
  },
];

export const KnowledgeHubView: React.FC = () => {
  const { currentUser, courses, uploadVideoLesson } = useApp();

  const role = String(
    (currentUser as any)?.roleName ?? (currentUser as any)?.role ?? '',
  ).toLowerCase();

  const isAdmin = [
    'super_admin',
    'company_admin',
    'hr_ops',
  ].includes(role);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] =
    useState<EcosystemCompany | null>(null);
  const [selectedTopic, setSelectedTopic] =
    useState<(typeof learningTopics)[number] | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSpeaker, setUploadSpeaker] = useState('');
  const [uploadSpeakerTitle, setUploadSpeakerTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadDuration, setUploadDuration] = useState('10 mins');
  const [uploadSummary, setUploadSummary] = useState('');

  const categories = [
    'all',
    'Getting Started',
    'Ways of Working',
    'EMS & Operations',
    'Policies & Governance',
    'Ecosystem Companies',
  ];

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ecosystemCompanies.filter((company) => {
      if (!query) return true;
      return [
        company.name,
        company.category,
        company.summary,
        ...company.capabilities,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [searchQuery]);

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return learningTopics.filter((topic) => {
      const categoryMatches =
        activeCategory === 'all' ||
        activeCategory === 'Ecosystem Companies' ||
        topic.category === activeCategory;
      const queryMatches =
        !query ||
        [topic.title, topic.category, topic.summary, ...topic.points]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return categoryMatches && queryMatches;
    });
  }, [activeCategory, searchQuery]);

  const handleUploadSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!uploadTitle.trim() || !uploadUrl.trim()) return;

    uploadVideoLesson(courses[0]?.id || 'course-est-1', {
      title: uploadTitle.trim(),
      duration: uploadDuration.trim() || 'Not specified',
      contentUrl: uploadUrl.trim(),
      description:
        uploadSummary.trim() ||
        'Learning video published by the company administrator.',
      speakerName: uploadSpeaker.trim() || 'Estuscia Group',
      speakerTitle: uploadSpeakerTitle.trim() || 'Company Learning',
    });

    setIsUploadModalOpen(false);
    setUploadTitle('');
    setUploadSpeaker('');
    setUploadSpeakerTitle('');
    setUploadUrl('');
    setUploadDuration('10 mins');
    setUploadSummary('');
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] via-[#0b1220] to-[#10152b] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              <BookOpen className="h-3.5 w-3.5" />
              Staff & Company Learning
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Estuscia Group Knowledge Hub
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Learn about Estuscia Group, explore its nine ecosystem firms,
              understand how teams collaborate, and find guidance for using the
              EMS staff portal.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <Building2 className="h-4 w-4 text-indigo-300" />
                9 ecosystem firms
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <Users className="h-4 w-4 text-indigo-300" />
                For staff and business users
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-indigo-300" />
                Role-aware learning
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={GROUP_WEBSITE}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Visit EstusciaGroup.com
              <ExternalLink className="h-4 w-4" />
            </a>
            {/* {isAdmin && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                <Plus className="h-4 w-4" />
                Upload learning video
              </button>
            )} */}
          </div>
        </div>
      </section>

      {/* Mission and purpose */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <Sparkles className="mb-3 h-5 w-5 text-indigo-300" />
          <h2 className="font-semibold">Our purpose</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Build businesses that address real-world challenges and support
            entrepreneurs, startups, and organizations with strategic solutions.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <Layers className="mb-3 h-5 w-5 text-indigo-300" />
          <h2 className="font-semibold">One connected ecosystem</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The group brings together specialist firms across finance, creative
            services, technology, commerce, fashion, trade, and fragrance.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <ShieldCheck className="mb-3 h-5 w-5 text-indigo-300" />
          <h2 className="font-semibold">How we work</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Integrity, innovation, sustainability, empowerment, and a global
            outlook guide the way we describe and develop the ecosystem.
          </p>
        </div>
      </section>

      {/* Search and filters */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search companies, services, topics, or EMS guidance..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/60"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                activeCategory === category
                  ? 'bg-indigo-500 text-white'
                  : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
            >
              {category === 'all' ? 'All learning' : category}
            </button>
          ))}
        </div>
      </section>

      {/* Ecosystem firms */}
      {(activeCategory === 'all' ||
        activeCategory === 'Ecosystem Companies') && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                Explore the ecosystem
              </p>
              <h2 className="mt-1 text-xl font-bold">Nine firms, connected by one vision</h2>
              <p className="mt-1 text-sm text-slate-400">
                Select a company to understand its focus and capabilities.
              </p>
            </div>
            <a
              href={`${GROUP_WEBSITE}#ecosystem`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 sm:inline-flex"
            >
              Official website <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCompanies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => setSelectedCompany(company)}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-slate-900"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="rounded-xl border border-indigo-300/15 bg-indigo-400/10 p-2.5 text-indigo-200">
                    {company.id === 'group' ? (
                      <Building2 className="h-5 w-5" />
                    ) : (
                      <Globe2 className="h-5 w-5" />
                    )}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-indigo-300" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                  {company.category}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{company.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">
                  {company.summary}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-200">
                  Explore company <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
          {filteredCompanies.length === 0 && (
            <p className="rounded-xl border border-white/10 p-6 text-center text-sm text-slate-400">
              No ecosystem companies match your search.
            </p>
          )}
        </section>
      )}

      {/* Staff learning topics */}
      {activeCategory !== 'Ecosystem Companies' && (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Practical learning
            </p>
            <h2 className="mt-1 text-xl font-bold">Useful guidance for staff and users</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredTopics.map((topic) => (
              <button
                key={topic.title}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className="group rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left transition hover:border-indigo-400/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-lg bg-indigo-400/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-200">
                    {topic.category}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-300" />
                </div>
                <h3 className="mt-4 font-semibold">{topic.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{topic.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-200">
                  Read learning guide <BookOpen className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
          {filteredTopics.length === 0 && (
            <p className="rounded-xl border border-white/10 p-6 text-center text-sm text-slate-400">
              No learning guides match your search or selected category.
            </p>
          )}
        </section>
      )}

      {/* Company details modal */}
      {selectedCompany && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="company-detail-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCompany(null);
          }}
        >
          <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  {selectedCompany.category}
                </p>
                <h2 id="company-detail-title" className="mt-2 text-xl font-bold sm:text-2xl">
                  {selectedCompany.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                aria-label="Close company details"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <p className="text-sm leading-7 text-slate-300">
                {selectedCompany.summary}
              </p>
              <div>
                <h3 className="font-semibold">Key areas of focus</h3>
                <ul className="mt-3 space-y-2">
                  {selectedCompany.capabilities.map((capability) => (
                    <li key={capability} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Relevant audience
                </p>
                <p className="mt-2 text-sm text-slate-300">{selectedCompany.audience}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5"
                >
                  Close
                </button>
                <a
                  href={GROUP_WEBSITE}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400"
                >
                  Visit official website <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learning guide modal */}
      {selectedTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="learning-guide-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedTopic(null);
          }}
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950 p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-lg bg-indigo-400/10 px-2.5 py-1 text-xs font-semibold text-indigo-200">
                  {selectedTopic.category}
                </span>
                <h2 id="learning-guide-title" className="mt-4 text-xl font-bold">
                  {selectedTopic.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                aria-label="Close learning guide"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{selectedTopic.summary}</p>
            <ul className="mt-5 space-y-3">
              {selectedTopic.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm leading-6 text-slate-300">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin video upload modal */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-video-title"
        >
          <div className="my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-400/10 p-2 text-indigo-200">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="upload-video-title" className="font-bold">Upload learning video</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Publish a real video URL and a useful summary for staff.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Close upload form"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
              <div>
                <label htmlFor="learning-title" className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Video title *
                </label>
                <input
                  id="learning-title"
                  required
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  placeholder="Enter a clear learning title"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-400/60"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="learning-speaker" className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Presenter
                  </label>
                  <input
                    id="learning-speaker"
                    value={uploadSpeaker}
                    onChange={(event) => setUploadSpeaker(event.target.value)}
                    placeholder="Presenter name or team"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-400/60"
                  />
                </div>
                <div>
                  <label htmlFor="learning-speaker-title" className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Presenter role
                  </label>
                  <input
                    id="learning-speaker-title"
                    value={uploadSpeakerTitle}
                    onChange={(event) => setUploadSpeakerTitle(event.target.value)}
                    placeholder="Department or role"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-400/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="learning-url" className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Video or embed URL *
                  </label>
                  <input
                    id="learning-url"
                    type="url"
                    required
                    value={uploadUrl}
                    onChange={(event) => setUploadUrl(event.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-400/60"
                  />
                </div>
                <div>
                  <label htmlFor="learning-duration" className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Duration
                  </label>
                  <input
                    id="learning-duration"
                    value={uploadDuration}
                    onChange={(event) => setUploadDuration(event.target.value)}
                    placeholder="e.g. 10 mins"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-400/60"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="learning-summary" className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Summary and key lessons
                </label>
                <textarea
                  id="learning-summary"
                  rows={4}
                  value={uploadSummary}
                  onChange={(event) => setUploadSummary(event.target.value)}
                  placeholder="Explain what staff will learn from this video..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-400/60"
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400"
                >
                  <Send className="h-4 w-4" />
                  Publish video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
