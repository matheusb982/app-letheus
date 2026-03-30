import { redirect } from "next/navigation";
import { checkOnboardingStatus } from "@/lib/actions/onboarding-actions";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const status = await checkOnboardingStatus();

  if (status.completed) {
    redirect("/dashboard");
  }

  return <OnboardingWizard userName={status.userName ?? "Usuário"} />;
}
