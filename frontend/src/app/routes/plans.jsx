import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fab from '../../components/ui/Fab';
import { SkeletonList } from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useToast } from '../../components/ui/Toast';
import { usePlans, useDeletePlan, useStartPlan, PlanList, PlanForm } from '../../features/plans';

export default function PlansRoute() {
  const navigate = useNavigate();
  const { data: plans = [], isLoading } = usePlans();
  const deletePlan = useDeletePlan();
  const startPlan = useStartPlan();
  const toast = useToast();
  const [startingId, setStartingId] = useState(null);
  // Formularz tworzenia planu był na stałe rozwinięty pod listą — pięć pól
  // i przycisk „Zapisz plan” zajmowały więcej miejsca niż same plany.
  // Teraz otwiera go akcja w strefie kciuka, a lista dostaje cały ekran.
  const [formOpen, setFormOpen] = useState(false);

  async function handleStart(plan) {
    setStartingId(plan.id);
    try {
      const workout = await startPlan.mutateAsync(plan.id);
      navigate(`/workouts/${workout.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStartingId(null);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 pb-[152px] pt-6">
      <header>
        <h1 className="m-0 font-display text-display font-semibold tracking-wide">Twoje plany</h1>
        <p className="m-0 mt-1 text-body text-text-muted">
          Ułóż plan raz, odpalaj trening jednym tapnięciem.
        </p>
      </header>

      <ErrorBanner>{deletePlan.error?.message}</ErrorBanner>
      <ErrorBanner>{startPlan.error?.message}</ErrorBanner>

      {isLoading ? (
        <SkeletonList count={3} height={140} />
      ) : (
        <PlanList
          plans={plans}
          startingId={startingId}
          onStart={handleStart}
          onDelete={(plan) => deletePlan.mutateAsync(plan.id)}
          onCreate={() => setFormOpen(true)}
        />
      )}

      {formOpen && <PlanForm onCreated={() => setFormOpen(false)} />}

      <Fab
        label={formOpen ? 'Ukryj formularz' : 'Nowy plan'}
        onClick={() => setFormOpen((v) => !v)}
      />
    </main>
  );
}
