'use client';

import { useTransition } from 'react';
import { Check, X, Trash2, Clock, ShieldCheck, ShieldX } from 'lucide-react';
import { approveRule, rejectRule, deleteRule } from '@/app/rules/actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface Rule {
  id: string;
  text: string;
  proposed_by: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface RuleListProps {
  rules: Rule[];
  userId: string;
  partnerName: string | null;
}

function RuleCard({
  rule,
  userId,
  partnerName,
}: {
  rule: Rule;
  userId: string;
  partnerName: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const isProposer = rule.proposed_by === userId;
  const canAct = !isProposer && rule.status === 'pending';

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveRule(rule.id);
        toast.success('Règle approuvée !');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur');
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectRule(rule.id);
        toast.info('Règle refusée.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur');
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteRule(rule.id);
        toast.success('Règle supprimée.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur');
      }
    });
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      label: isProposer
        ? `En attente de ${partnerName ?? 'votre partenaire'}`
        : 'En attente de votre approbation',
      badge: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
    },
    approved: {
      icon: ShieldCheck,
      label: 'Approuvée par les deux',
      badge: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
    },
    rejected: {
      icon: ShieldX,
      label: 'Refusée',
      badge: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
    },
  };

  const config = statusConfig[rule.status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'surface-panel-soft rounded-[1.6rem] p-5 transition-all',
        isPending && 'pointer-events-none opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-base font-semibold leading-relaxed text-foreground">
          {rule.text}
        </p>
        <button
          type="button"
          onClick={handleDelete}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition-colors hover:border-red-300/40 hover:text-red-200"
          aria-label="Supprimer cette règle"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
            config.badge
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {config.label}
        </span>

        <span className="text-xs text-muted-foreground">
          {isProposer ? 'Proposée par vous' : `Proposée par ${partnerName ?? 'votre partenaire'}`}
        </span>
      </div>

      {canAct && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2.5 text-sm font-bold text-emerald-950 transition-all hover:-translate-y-0.5"
          >
            <Check className="h-4 w-4" />
            Approuver
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.08]"
          >
            <X className="h-4 w-4" />
            Refuser
          </button>
        </div>
      )}
    </div>
  );
}

export function RuleList({ rules, userId, partnerName }: RuleListProps) {
  if (rules.length === 0) {
    return (
      <div className="surface-panel-soft flex flex-col items-center justify-center rounded-[1.6rem] px-6 py-12 text-center">
        <ShieldCheck className="h-10 w-10 text-[#8fb2ff]/55" />
        <p className="mt-4 text-lg font-semibold text-foreground">
          Aucune règle pour l&apos;instant
        </p>
        <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
          Proposez une première règle et votre partenaire pourra l&apos;approuver ou
          la refuser. Les règles approuvées forment votre charte de couple.
        </p>
      </div>
    );
  }

  const approved = rules.filter((r) => r.status === 'approved');
  const pending = rules.filter((r) => r.status === 'pending');
  const rejected = rules.filter((r) => r.status === 'rejected');

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="section-kicker">En attente d&apos;approbation</p>
          {pending.map((rule) => (
            <RuleCard key={rule.id} rule={rule} userId={userId} partnerName={partnerName} />
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="space-y-3">
          <p className="section-kicker">Règles validées</p>
          {approved.map((rule) => (
            <RuleCard key={rule.id} rule={rule} userId={userId} partnerName={partnerName} />
          ))}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="space-y-3">
          <p className="section-kicker">Règles refusées</p>
          {rejected.map((rule) => (
            <RuleCard key={rule.id} rule={rule} userId={userId} partnerName={partnerName} />
          ))}
        </div>
      )}
    </div>
  );
}
