export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // Layout limpo para o onboarding — sem padding do header/nav global
  return (
    <div style={{ minHeight: '100vh', paddingTop: 0, paddingBottom: 0 }}>
      {children}
    </div>
  );
}
