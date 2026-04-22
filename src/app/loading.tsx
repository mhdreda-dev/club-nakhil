import { SplashScreen } from "@/components/splash-screen";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SplashScreen label="Preparing your training arena" />
    </div>
  );
}
