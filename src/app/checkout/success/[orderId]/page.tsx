import { redirect } from "next/navigation";

type SuccessProps = { params: Promise<{ orderId: string }> };

export default async function Page({ params }: SuccessProps) {
  redirect(`/order/${encodeURIComponent((await params).orderId)}`);
}
