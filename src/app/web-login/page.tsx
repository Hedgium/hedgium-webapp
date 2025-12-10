import WebLoginClient from "@/components/WebLoginClient";

export default function Page({ searchParams }) {
  const login_url = decodeURIComponent(searchParams.login_url || "");
  const token = searchParams.token || "";

  return <WebLoginClient loginUrl={login_url} token={token} />;
}
