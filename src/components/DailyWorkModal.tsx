import React, { useState } from 'react';
import {
  X,
  PhoneCall,
  UserCheck,
  Calendar,
  FileText,
  Send,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { submitDailyWorkLog } from '../api/dailyWork';

export const DailyWorkModal: React.FC = () => {
  const {
    isWorkLogModalOpen,
    setIsWorkLogModalOpen,
    currentUser,
  } = useApp();

  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [callsMade, setCallsMade] = useState('');
  const [callsConnected, setCallsConnected] = useState('');
  const [leadsRespondedWell, setLeadsRespondedWell] = useState('');
  const [followUpsScheduled, setFollowUpsScheduled] = useState('');
  const [narration, setNarration] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isWorkLogModalOpen) {
    return null;
  }

  // Only Sales Staff can submit Sales Daily Work.
  const role =
    currentUser.roleName ||
    currentUser.role ||
    '';

  if (role !== 'sales_staff') {
    return null;
  }

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setIsWorkLogModalOpen(false);
    setError(null);
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError(null);

    if (!date) {
      setError('Please select a work date.');
      return;
    }

    if (!narration.trim()) {
      setError('Please enter a narration for today\'s work.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(`${date}T00:00:00`);

    if (selectedDate > today) {
      setError('Work date cannot be in the future.');
      return;
    }

    const parseOptionalNumber = (
      value: string
    ): number | undefined => {
      if (!value.trim()) {
        return undefined;
      }

      const parsed = Number(value);

      if (!Number.isFinite(parsed)) {
        return undefined;
      }

      return parsed;
    };

    const callsMadeValue =
      parseOptionalNumber(callsMade);

    const callsConnectedValue =
      parseOptionalNumber(callsConnected);

    const leadsRespondedWellValue =
      parseOptionalNumber(leadsRespondedWell);

    const followUpsScheduledValue =
      parseOptionalNumber(followUpsScheduled);

    if (
      callsMadeValue !== undefined &&
      callsMadeValue < 0
    ) {
      setError('Calls made cannot be negative.');
      return;
    }

    if (
      callsConnectedValue !== undefined &&
      callsConnectedValue < 0
    ) {
      setError('Calls connected cannot be negative.');
      return;
    }

    if (
      leadsRespondedWellValue !== undefined &&
      leadsRespondedWellValue < 0
    ) {
      setError(
        'Leads responded well cannot be negative.'
      );
      return;
    }

    if (
      followUpsScheduledValue !== undefined &&
      followUpsScheduledValue < 0
    ) {
      setError(
        'Follow-ups scheduled cannot be negative.'
      );
      return;
    }

    if (
      callsMadeValue !== undefined &&
      callsConnectedValue !== undefined &&
      callsConnectedValue > callsMadeValue
    ) {
      setError(
        'Calls connected cannot be greater than calls made.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await submitDailyWorkLog({
        workDate: date,

        // 0 = Sales
        workType: 0,

        narration: narration.trim(),

        callsMade: callsMadeValue,
        callsConnected: callsConnectedValue,
        leadsRespondedWell:
          leadsRespondedWellValue,
        followUpsScheduled:
          followUpsScheduledValue,
      });

      // Reset form after successful submission.
      setDate(new Date().toISOString().split('T')[0]);
      setCallsMade('');
      setCallsConnected('');
      setLeadsRespondedWell('');
      setFollowUpsScheduled('');
      setNarration('');

      setIsWorkLogModalOpen(false);
    } catch (err) {
      console.error(
        'Failed to submit daily work:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to submit daily work. Please try again.';

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-purple-500/20 bg-[#09071e] shadow-2xl">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/20">
              <Sparkles
                size={22}
                className="text-purple-400"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Daily Sales Work
              </h2>

              <p className="text-sm text-gray-400">
                Submit your sales activity for the day
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================== */}
        {/* BODY */}
        {/* ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="max-h-[75vh] overflow-y-auto"
        >
          <div className="space-y-6 p-6">

            {/* ERROR */}

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <p className="text-sm text-red-300">
                  {error}
                </p>
              </div>
            )}

            {/* ================================================== */}
            {/* USER / BRANCH INFO */}
            {/* ================================================== */}

            <div className="rounded-xl border border-white/10 bg-[#0e0b2e] p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Employee
                  </p>

                  <p className="mt-1 text-sm font-medium text-white">
                    {currentUser.username}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Designation
                  </p>

                  <p className="mt-1 text-sm font-medium text-white">
                    {currentUser.designation || 'Sales Staff'}
                  </p>
                </div>

              </div>
            </div>

            {/* ================================================== */}
            {/* DATE */}
            {/* ================================================== */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Work Date
              </label>

              <div className="relative">
                <Calendar
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  value={date}
                  max={new Date()
                    .toISOString()
                    .split('T')[0]}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/10 bg-[#0e0b2e] py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-purple-500/50"
                />
              </div>
            </div>

            {/* ================================================== */}
            {/* SALES METRICS */}
            {/* ================================================== */}

            <div>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">
                  Sales Activity
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Enter the activity completed during the day.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Calls Made */}

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Calls Made
                  </label>

                  <div className="relative">
                    <PhoneCall
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      type="number"
                      min="0"
                      value={callsMade}
                      onChange={(event) =>
                        setCallsMade(event.target.value)
                      }
                      disabled={isSubmitting}
                      placeholder="0"
                      className="w-full rounded-xl border border-white/10 bg-[#0e0b2e] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {/* Calls Connected */}

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Calls Connected
                  </label>

                  <div className="relative">
                    <UserCheck
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      type="number"
                      min="0"
                      value={callsConnected}
                      onChange={(event) =>
                        setCallsConnected(event.target.value)
                      }
                      disabled={isSubmitting}
                      placeholder="0"
                      className="w-full rounded-xl border border-white/10 bg-[#0e0b2e] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {/* Leads */}

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Leads Responded Well
                  </label>

                  <div className="relative">
                    <UserCheck
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      type="number"
                      min="0"
                      value={leadsRespondedWell}
                      onChange={(event) =>
                        setLeadsRespondedWell(
                          event.target.value
                        )
                      }
                      disabled={isSubmitting}
                      placeholder="0"
                      className="w-full rounded-xl border border-white/10 bg-[#0e0b2e] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {/* Follow Ups */}

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Follow-ups Scheduled
                  </label>

                  <div className="relative">
                    <Calendar
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      type="number"
                      min="0"
                      value={followUpsScheduled}
                      onChange={(event) =>
                        setFollowUpsScheduled(
                          event.target.value
                        )
                      }
                      disabled={isSubmitting}
                      placeholder="0"
                      className="w-full rounded-xl border border-white/10 bg-[#0e0b2e] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ================================================== */}
            {/* NARRATION */}
            {/* ================================================== */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Daily Narration
              </label>

              <div className="relative">
                <FileText
                  size={17}
                  className="pointer-events-none absolute left-3 top-3.5 text-gray-500"
                />

                <textarea
                  value={narration}
                  onChange={(event) =>
                    setNarration(event.target.value)
                  }
                  disabled={isSubmitting}
                  rows={5}
                  placeholder="Describe the work completed today..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0e0b2e] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500/50"
                />
              </div>
            </div>

          </div>

          {/* ================================================== */}
          {/* FOOTER */}
          {/* ================================================== */}

          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />

              {isSubmitting
                ? 'Submitting...'
                : 'Submit Daily Work'}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};