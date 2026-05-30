import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="ZEB Travels & Traders Pvt Ltd SignIn Dashboard"
        description="This is Admin SignIn Dashboard page for ZEB Travels & Traders Pvt Ltd"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
