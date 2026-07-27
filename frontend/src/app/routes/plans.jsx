import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { usePlans, useDeletePlan, useStartPlan, PlanList, PlanForm } from '../../features/plans';

export default function PlansRoute() {
  const navigate = useNavigate();
  const { data: plans = [], isLoading } = usePlans();
  const deletePlan = useDeletePlan();
  const startPlan = useStartPlan();
  const [startingId, setStartingId] = useState(null);

  async function handleStart(plan) {
    setStartingId(plan.id);
    try {
      const workout = await startPlan.mutateAsync(plan.id);
      navigate(`/workouts/${workout.id}`);
    } finally {
      setStartingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <Button variant="link" onClick={() => navigate('/workouts')}>
        ← Wszystkie treningi
      </Button>
      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Twoje plany</h1>
      <p className="-mt-3.5 mb-1 text-sm text-text-muted">Ułóż plan raz, odpalaj trening jednym kliknięciem.</p>

      <ErrorBanner>{deletePlan.error?.message}</ErrorBanner>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton />
          <Skeleton />
        </div>
      ) : (
        <PlanList
          plans={plans}
          startingId={startingId}
          onStart={handleStart}
          onDelete={(plan) => deletePlan.mutateAsync(plan.id)}
        />
      )}

      <PlanForm />
    </div>
  );
}
