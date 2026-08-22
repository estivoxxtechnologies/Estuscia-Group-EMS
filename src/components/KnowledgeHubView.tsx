import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Course } from '../types';
import {
  Play,
  Video,
  Plus,
  BookOpen,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  Download,
  Share2,
  Search,
  ExternalLink,
  Shield,
  Layers,
  X,
  Send,
  Building2,
} from 'lucide-react';

export const KnowledgeHubView: React.FC = () => {
  const { courses, currentUser, uploadVideoLesson } = useApp();

  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'company_admin' || currentUser.role === 'hr_ops';

  const [activeCategory, setActiveCategory] = useState<'all' | 'ceo' | 'slabs' | 'sales' | 'operations'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Video Player Modal state
  const [activeVideo, setActiveVideo] = useState<{
    title: string;
    speaker: string;
    speakerTitle: string;
    duration: string;
    videoUrl: string;
    summary: string;
    category: string;
    courseId?: string;
  } | null>(null);

  // Upload Video Masterclass Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSpeaker, setUploadSpeaker] = useState('Alexander Sterling');
  const [uploadSpeakerTitle, setUploadSpeakerTitle] = useState('CEO & Managing Partner');
  const [uploadUrl, setUploadUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [uploadDuration, setUploadDuration] = useState('18 mins');
  const [uploadCategory, setUploadCategory] = useState('Investment Slabs Economics');
  const [uploadSummary, setUploadSummary] = useState('');

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadVideoLesson(courses[0]?.id || 'course-est-1', {
      title: uploadTitle,
      duration: uploadDuration,
      contentUrl: uploadUrl,
      description: uploadSummary || 'Executive video masterclass uploaded by leadership.',
      speakerName: uploadSpeaker,
      speakerTitle: uploadSpeakerTitle,
    });
    setIsUploadModalOpen(false);
    // Reset
    setUploadTitle('');
    setUploadSummary('');
  };

  // Curated masterclasses list
  const videoMasterclasses = [
    {
      id: 'vid-1',
      title: 'CEO Keynote: Estuscia Vision & The 2026 Sovereign Investment Slabs',
      speaker: 'Alexander Sterling',
      speakerTitle: 'Chief Executive Officer & Founder',
      duration: '22 mins',
      category: 'ceo',
      categoryLabel: 'CEO Keynote',
      thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      summary: 'Alexander Sterling explains the foundational principles of Estuscia capital preservation, time-dependent yield structures, and how our multi-tenant ecosystem protects client capital.',
      keyTakeaways: [
        'Why time-dependent slabs offer superior yield predictability over public equity markets.',
        'The role of collateralization and escrow custody in investor trust.',
        'Target milestones for advisory executives in H1 2026.',
      ],
    },
    {
      id: 'vid-2',
      title: 'Mastering Investment Slabs: 6-Mo vs 12-Mo vs 24-Mo Yield Economics',
      speaker: 'Marcus Vance',
      speakerTitle: 'Managing Partner & Head of Wealth',
      duration: '18 mins',
      category: 'slabs',
      categoryLabel: 'Slab Economics',
      thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      summary: 'A deep-dive technical teaching on how Estuscia computes annual yields from 12.5% to 24.0% p.a., compounding mechanics, and customer payout timelines.',
      keyTakeaways: [
        'How to explain lock-in liquidity to high-net-worth investors.',
        'Accrued yield calculation formula and monthly interest disbursement.',
        'Advising clients on rollover strategies upon maturity.',
      ],
    },
    {
      id: 'vid-3',
      title: 'High-Conversion Client Pitching & Handling HNI Investor Objections',
      speaker: 'Sarah Chen',
      speakerTitle: 'Principal Private Client Advisor',
      duration: '15 mins',
      category: 'sales',
      categoryLabel: 'Client Pitching',
      thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      summary: 'Practical advisory tactics for phone outreach, structuring hot lead follow-ups, and presenting official payment slips and deposit certificates to close deals.',
      keyTakeaways: [
        'The 3-touch phone follow-up framework that doubles closing rates.',
        'Presenting official deposit receipts as proof of sovereign custody.',
        'Maximizing your staff incentive tier commissions.',
      ],
    },
    {
      id: 'vid-4',
      title: 'Biometric Attendance, Payroll Cycles & Employee Operations',
      speaker: 'Priya Narang',
      speakerTitle: 'Head of Human Resources & People Ops',
      duration: '12 mins',
      category: 'operations',
      categoryLabel: 'Company Operations',
      thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      summary: 'How attendance logs, Excel batch uploads, leave requests, and monthly payroll incentive disbursements are automatically computed in Estuscia EMS.',
      keyTakeaways: [
        'How biometric check-ins directly reconcile with monthly payslips.',
        'Rules for submitting daily work narrations before 19:00 PM.',
        'Incentive approval chain from Branch Manager to HR disbursement.',
      ],
    },
  ];

  const filteredVideos = videoMasterclasses.filter((v) => {
    if (activeCategory !== 'all' && v.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.speaker.toLowerCase().includes(q) ||
        v.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Knowledge Hub & Executive Masterclasses
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30 font-semibold">
              Teaching Hub
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Direct video teachings from executive leadership on investment slabs, client pitch strategies, and company operations. No tests or exams — pure high-yield knowledge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5C3FE0] to-[#7C3AED] hover:from-[#6A4DF4] hover:to-[#8B5CF6] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Upload Video Masterclass</span>
            </button>
          )}
        </div>
      </div>

      {/* Featured Video Highlight Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#120e3a] via-[#09081E] to-[#040312] border border-[#5C3FE0]/30 relative overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5C3FE0]/30 text-purple-300 text-xs font-bold border border-[#5C3FE0]/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Featured Leadership Masterclass</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
              CEO Keynote: Estuscia Vision & The 2026 Sovereign Investment Slabs
            </h2>

            <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
              Alexander Sterling, CEO & Founder, walks through the operational mechanics of Estuscia’s multi-tenant investment infrastructure, yield generation, and client capital custody.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <User className="w-3.5 h-3.5 text-[#5C3FE0]" />
                Alexander Sterling (CEO)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                22 Minutes
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[11px]">
                Essential For All Staff
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setActiveVideo(videoMasterclasses[0])}
                className="px-5 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#6A4DF4] text-white font-bold text-xs shadow-lg shadow-[#5C3FE0]/40 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Video Masterclass</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative group cursor-pointer" onClick={() => setActiveVideo(videoMasterclasses[0])}>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative">
              <img
                src={videoMasterclasses[0].thumbnail}
                alt="CEO Keynote"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#5C3FE0]/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-white ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#5C3FE0] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Masterclasses ({videoMasterclasses.length})
            </button>
            <button
              onClick={() => setActiveCategory('ceo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === 'ceo'
                  ? 'bg-[#5C3FE0] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CEO & Executive Keynotes
            </button>
            <button
              onClick={() => setActiveCategory('slabs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === 'slabs'
                  ? 'bg-[#5C3FE0] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Investment Slabs & Economics
            </button>
            <button
              onClick={() => setActiveCategory('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === 'sales'
                  ? 'bg-[#5C3FE0] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Client Advisory Pitching
            </button>
          </div>

          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search masterclasses, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#5C3FE0]"
            />
          </div>

        </div>
      </div>

      {/* Video Masterclasses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="p-5 rounded-2xl bg-[#09081E] border border-white/10 hover:border-[#5C3FE0]/40 transition-all space-y-4 group"
          >
            {/* Thumbnail */}
            <div
              className="aspect-video w-full rounded-xl overflow-hidden relative cursor-pointer"
              onClick={() => setActiveVideo(video)}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#5C3FE0] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                {video.duration}
              </div>
            </div>

            {/* Video Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#5C3FE0]/20 text-purple-300 border border-[#5C3FE0]/30">
                  {video.categoryLabel}
                </span>
                <span className="text-[11px] text-gray-400">{video.duration}</span>
              </div>

              <h3
                onClick={() => setActiveVideo(video)}
                className="text-base font-bold text-white group-hover:text-purple-300 transition-colors cursor-pointer line-clamp-2"
              >
                {video.title}
              </h3>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <User className="w-3.5 h-3.5 text-[#5C3FE0]" />
                <span className="font-semibold text-gray-200">{video.speaker}</span>
                <span>•</span>
                <span className="text-[11px] text-gray-400">{video.speakerTitle}</span>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                {video.summary}
              </p>
            </div>

            {/* Key Takeaways list */}
            {video.keyTakeaways && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Core Knowledge Points:
                </span>
                {video.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-gray-300 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={() => setActiveVideo(video)}
                className="text-xs font-bold text-[#5C3FE0] hover:text-purple-300 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Play Masterclass</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#09081E] border border-white/20 rounded-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{activeVideo.title}</h3>
                  <p className="text-xs text-gray-400">
                    Presented by {activeVideo.speaker} ({activeVideo.speakerTitle})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Frame */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`${activeVideo.videoUrl}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Notes & Summary */}
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Executive Summary & Context</h4>
                <p className="text-xs text-gray-300 leading-relaxed">{activeVideo.summary}</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">
                  Key Takeaways & Best Practices
                </span>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Always present Tier 2 (15.5% p.a. • 12 Mo) as our core institutional flagship slab.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Issue official Customer Deposit Slips within 10 minutes of escrow confirmation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Log all daily phone outreach remarks before 19:00 PM for managerial review.</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Knowledge Unit Completed</span>
                </span>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="px-4 py-2 rounded-xl bg-[#5C3FE0] text-white text-xs font-bold shadow"
                >
                  Close Player
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Admin Upload Video Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#09081E] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-8">
            
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upload New Video Masterclass</h3>
                  <p className="text-xs text-gray-400">
                    Publish leadership video teachings to all employees across the firm.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Video Masterclass Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. CEO Keynote: Sovereign Yield Architecture for Q3"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Executive / Speaker Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadSpeaker}
                    onChange={(e) => setUploadSpeaker(e.target.value)}
                    placeholder="Alexander Sterling"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Speaker Title / Role
                  </label>
                  <input
                    type="text"
                    value={uploadSpeakerTitle}
                    onChange={(e) => setUploadSpeakerTitle(e.target.value)}
                    placeholder="CEO & Managing Partner"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Video Stream / Embed URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://youtube.com/embed/..."
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={uploadDuration}
                    onChange={(e) => setUploadDuration(e.target.value)}
                    placeholder="e.g. 20 mins"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Masterclass Summary & Key Lessons *
                </label>
                <textarea
                  rows={3}
                  required
                  value={uploadSummary}
                  onChange={(e) => setUploadSummary(e.target.value)}
                  placeholder="Summarize the core insights taught in this video lesson..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#6A4DF4] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Masterclass</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
