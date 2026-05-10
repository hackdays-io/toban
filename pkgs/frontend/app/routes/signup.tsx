import { type FC, Suspense, lazy } from "react";
import { AuthHero } from "~/components/composite/auth-hero";
import { AuthLayout } from "~/components/layout/AuthLayout";

// Defer the form (and its Privy/wallet hook chain) into a lazy chunk so
// `signup.tsx`'s top-level evaluation — which the React Router manifest script
// triggers before hydration — doesn't pull in @privy-io/react-auth. Privy's
// styled-components dependency injects <style data-styled> into <head> on
// module evaluation, which would shift <head> children and break hydration on
// direct entry to /signup. Same pattern as `PrivyAppRoot` in `root.tsx`.
const SignupForm = lazy(() => import("~/components/SignupForm"));

const Signup: FC = () => {
  return (
    <AuthLayout
      hero={
        <AuthHero
          title={
            <>
              はじめまして、
              <br />
              あなたのことを教えてください。
            </>
          }
          description="表示名とアイコンはワークスペースの仲間に見える名札になります。あとから変更できます。"
        />
      }
    >
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
};

export default Signup;
