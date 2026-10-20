import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect(
    process.env.GOP_CONTENT_ADMIN_URL ||
      "https://pf.digigalaxy.cloud/app/content-article"
  );
}
