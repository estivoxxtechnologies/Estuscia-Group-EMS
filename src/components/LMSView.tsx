import React, { useState } from 'react';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Award,
  BookOpen,
  HelpCircle,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Check,
  Video,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Course, Lesson, QuizQuestion } from '../types';

export const LMSView: React.FC = () => {
  const {
    courses,
    selectedCourseForPlayer,
    setSelectedCourseForPlayer,
    userProgress,
    completeLesson,
    submitQuizAttempt,
    setSelectedCertificateForView,
    currentUser,
  } = useApp();

  const [activeCourse, setActiveCourse] = useState<Course>(selectedCourseForPlayer || courses[0]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    activeCourse.modules[0]?.lessons[0]?.id || ''
  );
  const [activeTabMode, setActiveTabMode] = useState<'learn' | 'quiz'>('learn');

  // Collect all quiz questions across the course
  const allQuizQuestions: QuizQuestion[] = activeCourse.modules.flatMap((m) =>
    m.lessons.flatMap((l) => l.quiz || [])
  );

  // Fallback default questions if none declared
  const quizQuestions: QuizQuestion[] = allQuizQuestions.length > 0 ? allQuizQuestions : [
    {
      id: 'q-demo-1',
      question: 'What is the required minimum investor deposit for the Gold Privilege slab tier?',
      options: ['$10,000', '$100,000', '$250,000', '$1,000,000'],
      correctOptionIndex: 2,
      explanation: 'Gold Privilege covers investor capital from $250,000 up to $499,999.',
    },
    {
      id: 'q-demo-2',
      question: 'How are staff attendance logs recorded and updated in the Estuscia BLMP system?',
      options: [
        'Staff must click a mobile punch-out button each evening.',
        'Batch Excel/CSV logs uploaded by HR/Managers & verified biometrics.',
        'Staff writes their hours on paper logbooks.',
        'Automated GPS tracking only.',
      ],
      correctOptionIndex: 1,
      explanation: 'In the Estuscia architecture, staff punchout is not required directly by staff; records are securely batch uploaded and managed by HR/Managers.',
    },
    {
      id: 'q-demo-3',
      question: 'Which role has final authorization to release approved incentives into the monthly payroll cycle?',
      options: ['Staff Member', 'Content Trainer', 'HR / Operations & Finance', 'Client'],
      correctOptionIndex: 2,
      explanation: 'HR & Operations hold administrative authority to reconcile and release verified incentives into the automated payroll run.',
    },
  ];

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizPassed, setQuizPassed] = useState(false);

  const progKey = `${currentUser.id}_${activeCourse.id}`;
  const courseProg = userProgress[progKey] || {
    completedLessonIds: [],
    quizScores: {},
    isCertified: false,
  };

  // Find active lesson
  let activeLesson: Lesson | undefined;
  for (const mod of activeCourse.modules) {
    const found = mod.lessons.find((l) => l.id === selectedLessonId);
    if (found) {
      activeLesson = found;
      break;
    }
  }
  if (!activeLesson) {
    activeLesson = activeCourse.modules[0]?.lessons[0];
  }

  const handleLessonComplete = () => {
    if (activeLesson) {
      completeLesson(activeCourse.id, activeLesson.id);
    }
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleFinishQuiz = () => {
    let correctCount = 0;

    quizQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        correctCount += 1;
      }
    });

    const scorePct = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizScore(scorePct);
    const passed = scorePct >= (activeCourse.passingScorePercent || 80);
    setQuizPassed(passed);
    setQuizFinished(true);

    submitQuizAttempt(activeCourse.id, scorePct);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setQuizFinished(false);
    setQuizScore(0);
    setQuizPassed(false);
  };

  const totalLessons = activeCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = courseProg.completedLessonIds.length;
  const progressPercent = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Estuscia Learning & Certification Academy
              </h1>
              <p className="text-xs text-slate-400">
                Mandatory product architecture, investment slab governance, and compliance training
              </p>
            </div>
          </div>
        </div>

        {/* Course Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveCourse(c);
                setSelectedLessonId(c.modules[0]?.lessons[0]?.id || '');
                handleResetQuiz();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCourse.id === c.id
                  ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/30'
                  : 'bg-[#140f3d] text-slate-300 hover:bg-[#1f175a] border border-[#2d2770]'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Course Overview & Mode Switcher Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#120e3d] via-[#1a144f] to-[#0d092c] border border-[#2d2770] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase bg-[#5C3FE0]/30 text-[#A78BFA] px-2 py-0.5 rounded border border-[#5C3FE0]/40">
                {activeCourse.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Duration: {activeCourse.totalDuration || '2.5 Hours'} • {totalLessons} Lessons
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{activeCourse.title}</h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {activeCourse.description}
            </p>
          </div>

          {/* Learn vs Quiz Mode Tabs */}
          <div className="flex items-center gap-2 bg-[#09071c] p-1.5 rounded-xl border border-[#231e54]">
            <button
              onClick={() => setActiveTabMode('learn')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabMode === 'learn'
                  ? 'bg-[#5C3FE0] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lecture Modules</span>
            </button>

            <button
              onClick={() => setActiveTabMode('quiz')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabMode === 'quiz'
                  ? 'bg-[#5C3FE0] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Assessment & Exam ({quizQuestions.length})</span>
            </button>
          </div>
        </div>

        {/* Course Progress Bar */}
        <div className="pt-2">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>
              Course Progress: <strong className="text-white">{completedLessons} of {totalLessons}</strong> completed
            </span>
            <span className="font-mono text-purple-300 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#161240] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-500 to-[#5C3FE0] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* MODE 1: Lecture Player & Syllabus */}
      {activeTabMode === 'learn' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Video & Lecture Content (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Interactive Video Simulation Canvas */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#040312] border border-[#2d2770] shadow-2xl flex flex-col justify-between p-4 group">
              <img
                src={activeCourse.thumbnail}
                alt="Lecture preview"
                className="absolute inset-0 w-full h-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#040312] via-transparent to-black/60 pointer-events-none" />

              {/* Top lecture header */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-xs font-mono text-[#A78BFA] border border-white/10">
                  {activeLesson?.title}
                </span>
                <span className="text-xs text-slate-300 font-mono flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>{activeLesson?.duration || '15 mins'}</span>
                </span>
              </div>

              {/* Center Play Icon */}
              <div className="relative z-10 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#5C3FE0]/90 text-white flex items-center justify-center shadow-xl shadow-[#5C3FE0]/50 group-hover:scale-110 transition-transform cursor-pointer">
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
              </div>

              {/* Bottom Video Controls Simulator */}
              <div className="relative z-10 space-y-2">
                <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#5C3FE0] w-1/3 h-full rounded-full" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>04:15 / {activeLesson?.duration || '15 mins'}</span>
                  <span>1080p HD • Estuscia Studio Master</span>
                </div>
              </div>
            </div>

            {/* Lecture Notes & Completion Action */}
            <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{activeLesson?.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Instructor: <span className="text-slate-200 font-medium">{activeCourse.instructor.name}</span>
                  </p>
                </div>

                <button
                  onClick={handleLessonComplete}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    courseProg.completedLessonIds.includes(activeLesson?.id || '')
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#5C3FE0] hover:bg-[#7152FF] text-white shadow-lg shadow-[#5C3FE0]/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {courseProg.completedLessonIds.includes(activeLesson?.id || '')
                      ? 'Completed'
                      : 'Mark Lesson as Completed'}
                  </span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#0e0b2e] border border-[#231e54] text-xs text-slate-300 leading-relaxed space-y-2">
                <span className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider block">
                  Core Curriculum Takeaways:
                </span>
                <p>
                  1. Understand sovereign risk underwriting rules for Tier 4 (Platinum) and Tier 5 (Diamond) investment packages.
                </p>
                <p>
                  2. All investor payouts occur strictly on the 1st of every month via verified escrow bank channels.
                </p>
                <p>
                  3. Commission calculations are locked to the active slab version code at the exact timestamp of client deposit verification.
                </p>
              </div>
            </div>
          </div>

          {/* Course Syllabus Drawer (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#231e54]">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Course Syllabus & Lessons
                </span>
                <span className="text-[11px] text-purple-300 font-mono font-semibold">
                  {completedLessons}/{totalLessons} Done
                </span>
              </div>

              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {activeCourse.modules.map((mod, modIdx) => (
                  <div key={mod.id} className="space-y-2">
                    <div className="text-xs font-bold text-[#A78BFA] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#1c1652] flex items-center justify-center text-[10px] text-white">
                        {modIdx + 1}
                      </span>
                      <span>{mod.title}</span>
                    </div>

                    <div className="space-y-1 pl-6">
                      {mod.lessons.map((les) => {
                        const isDone = courseProg.completedLessonIds.includes(les.id);
                        const isCurrent = activeLesson?.id === les.id;

                        return (
                          <div
                            key={les.id}
                            onClick={() => setSelectedLessonId(les.id)}
                            className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                              isCurrent
                                ? 'bg-[#1a144f] border-[#5C3FE0] text-white font-semibold'
                                : 'bg-[#0e0b2e]/60 border-[#231e54] text-slate-300 hover:bg-[#130f3b]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{les.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                              {les.duration}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ready for Quiz Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#1b1452] to-[#120e3a] border border-[#5C3FE0]/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Ready for Certification Exam?</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-300">
                  Pass with 80%+ score to earn your official verified corporate certificate.
                </p>
                <button
                  onClick={() => setActiveTabMode('quiz')}
                  className="w-full py-2 rounded-lg bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold transition-all shadow"
                >
                  Start Assessment Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Assessment Quiz & Certificate Generator */}
      {activeTabMode === 'quiz' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {!quizFinished ? (
            <div className="p-6 md:p-8 rounded-2xl bg-[#09071e] border border-[#2d2770] space-y-6">
              {/* Quiz Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#231e54]">
                <div>
                  <h3 className="text-base font-bold text-white">Certification Assessment: {activeCourse.title}</h3>
                  <p className="text-xs text-slate-400">
                    Passing standard: {activeCourse.passingScorePercent || 80}% • Total Questions: {quizQuestions.length}
                  </p>
                </div>
                <div className="text-xs font-mono text-purple-300 font-bold bg-[#171147] px-3 py-1.5 rounded-xl border border-[#2d2770]">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </div>
              </div>

              {/* Current Question */}
              {(() => {
                const q = quizQuestions[currentQuestionIndex];
                if (!q) return null;

                return (
                  <div className="space-y-4">
                    <h4 className="text-sm md:text-base font-bold text-white leading-relaxed">
                      {q.question}
                    </h4>

                    <div className="space-y-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[q.id] === optIdx;

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectAnswer(q.id, optIdx)}
                            className={`p-4 rounded-xl border text-xs md:text-sm transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#1e165c] border-[#5C3FE0] text-white font-medium shadow-md'
                                : 'bg-[#0e0b2e] border-[#231e54] text-slate-300 hover:bg-[#151042]'
                            }`}
                          >
                            <span>{opt}</span>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-[#5C3FE0] bg-[#5C3FE0] text-white'
                                  : 'border-slate-600'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Quiz Navigation Buttons */}
              <div className="pt-4 border-t border-[#231e54] flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {currentQuestionIndex < quizQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold transition-all"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishQuiz}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Calculate Grade</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Result Screen */
            <div className="p-8 rounded-2xl bg-[#09071e] border border-[#2d2770] text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-gradient-to-tr from-[#5C3FE0] to-purple-400 text-white shadow-xl shadow-[#5C3FE0]/40">
                {quizPassed ? <Award className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
              </div>

              <div>
                <h3 className="text-xl md:text-2xl font-black text-white">
                  {quizPassed ? 'Congratulations! You Passed!' : 'Assessment Incomplete'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {quizPassed
                    ? `You scored ${quizScore}% (Minimum pass score is ${activeCourse.passingScorePercent || 80}%). Your verified completion certificate is generated!`
                    : `You scored ${quizScore}%. The passing threshold is ${activeCourse.passingScorePercent || 80}%. Please review the lectures and re-attempt.`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0e0b2e] border border-[#231e54] inline-block px-8">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Final Score</span>
                <span
                  className={`text-3xl font-black font-mono ${
                    quizPassed ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {quizScore}%
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleResetQuiz}
                  className="px-4 py-2.5 rounded-xl bg-[#140f3d] hover:bg-[#1f175a] border border-[#2d2770] text-xs font-semibold text-slate-200"
                >
                  Retake Assessment
                </button>

                {quizPassed && (
                  <button
                    onClick={() => {
                      setSelectedCertificateForView({
                        id: `CERT-EST-${Math.floor(1000 + Math.random() * 9000)}`,
                        courseId: activeCourse.id,
                        courseTitle: activeCourse.title,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        employeeCode: currentUser.employeeCode,
                        tenantName: 'Estuscia Global Holdings',
                        issueDate: new Date().toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }),
                        grade: `${quizScore}% Honors`,
                        instructorName: activeCourse.instructor.name,
                      });
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 flex items-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>View & Download Certificate</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

