"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { formatDate } from "@/lib/utils";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";

interface SentOffer {
  id: number;
  offer_type: string;
  field: string;
  role_name: string;
  job_description: string;
  min_salary: number | null;
  max_salary: number | null;
  status: string;
  created_at: string;
  candidate_username: string;
  candidate_name: string;
}

export default function SentOffersPage() {
  const [offers, setOffers] = useState<SentOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.role !== "employer") {
      router.push("/dashboard");
      return;
    }

    fetch("/api/employer/sent-offers")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOffers(data);
        } else {
          setOffers([]);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to fetch sent offers:", e);
        setLoading(false);
      });
  }, [user, router]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <span className="bg-[#ffc000]/20 text-[#b38600] border border-[#ffc000]/50 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Pending</span>;
      case "accepted":
        return <span className="bg-green-100 text-green-700 border border-green-300 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Accepted</span>;
      case "declined":
        return <span className="bg-red-100 text-red-700 border border-red-300 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Declined</span>;
      default:
        return <span className="bg-[#424242]/10 text-[#424242]/70 border border-[#424242]/20 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{status}</span>;
    }
  };

  if (!user || user.role !== "employer") {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="h-20 skeleton rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <AppNavbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 animate-fade-in">
        <div className="bg-[#424242] rounded-2xl p-8 mb-8 shadow-lg">
        <p className="text-[#ffc000] text-[11px] font-black uppercase tracking-widest mb-2">Tracking</p>
        <h1 className="text-white text-[28px] font-black">Sent Offers</h1>
        <p className="text-white/60 text-[14px] mt-2">
          Monitor the status of the applications and positions you've extended to candidates.
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-xl p-10 shadow-[var(--card-shadow)] text-center">
          <p className="text-4xl mb-4" aria-hidden="true">📬</p>
          <p className="text-[16px] font-black text-[#424242] mb-2">No offers sent yet</p>
          <p className="text-[14px] text-[#424242]/50 mb-6">Explore candidate profiles and send them an offer to get started.</p>
          <Link
            href="/talent"
            className="inline-flex bg-[#ffc000] text-[#424242] text-[14px] font-black px-6 py-3 rounded-full hover:bg-[#e6ac00] hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            Browse Talent
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl p-6 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-all border border-transparent hover:border-[#ffc000]/30 group">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[12px] font-black text-[#424242]/50 uppercase tracking-widest">{offer.offer_type}</span>
                    <span className="text-[11px] text-[#424242]/40">•</span>
                    <span className="text-[12px] font-medium text-[#424242]/50">{formatDate(offer.created_at)}</span>
                  </div>
                  <h3 className="text-[18px] font-black text-[#424242] mb-1">{offer.role_name}</h3>
                  <p className="text-[14px] text-[#424242]/60 mb-4">{offer.field}</p>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#424242]/5 rounded-full flex items-center justify-center text-[12px] font-black text-[#424242]">
                      {offer.candidate_name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#424242]">To: {offer.candidate_name}</p>
                      <Link href={`/talent/${offer.candidate_username}`} className="text-[11px] text-[#b38600] hover:underline">
                        @{offer.candidate_username}
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-4 min-w-[120px]">
                  {getStatusBadge(offer.status)}
                  
                  {(offer.min_salary || offer.max_salary) && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#424242]/40">Salary Range</p>
                      <p className="text-[14px] font-black text-[#424242]">
                        {offer.min_salary ? `$${offer.min_salary.toLocaleString()}` : "—"} - {offer.max_salary ? `$${offer.max_salary.toLocaleString()}` : "—"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>
      <Footer />
    </div>
  );
}
