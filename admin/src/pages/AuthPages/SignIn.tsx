import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="AL - MAMOORAH INTERNATIONAL PVT LTD SignIn Dashboard"
        description="This is Admin SignIn Dashboard page for AL - MAMOORAH INTERNATIONAL PVT LTD"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
