import { Star, Users } from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";
import { getAdminCustomers } from "./adminData";
import { AdminHeader } from "./AdminOrders";

export default function AdminCustomers() {
  const customers = getAdminCustomers();

  return (
    <AdminShell>
      <section className="grid gap-5">
        <AdminHeader
          icon={Users}
          eyebrow="Customer records"
          title="All Customers"
          text="Logged-in customer details, booking totals, returns, replacements, and product-wise reviews are shown together."
        />

        <div className="overflow-hidden rounded-2xl border border-[#eddac7] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full text-left">
              <thead className="bg-[#fffaf3] text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7563]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone No</th>
                  <th className="px-4 py-3">Products Booked</th>
                  <th className="px-4 py-3">Returned</th>
                  <th className="px-4 py-3">Replaced</th>
                  <th className="px-4 py-3">Avg Rating</th>
                  <th className="px-4 py-3">Product Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0dfcf]">
                {customers.length ? (
                  customers.map((customer) => (
                    <tr key={customer.id} className="align-top transition hover:bg-[#fffaf3]">
                      <td className="px-4 py-4">
                        <p className="text-sm font-black text-black">{customer.name}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-[#5d4a3c]">{customer.email}</td>
                      <td className="px-4 py-4 text-sm font-bold text-[#5d4a3c]">{customer.phone}</td>
                      <td className="px-4 py-4 text-sm font-black">{customer.totalBooked}</td>
                      <td className="px-4 py-4 text-sm font-black text-[#c03545]">{customer.returned}</td>
                      <td className="px-4 py-4 text-sm font-black text-[#b66b12]">{customer.replaced}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ffeedd] px-3 py-1 text-xs font-black text-black">
                          <Star size={13} fill="currentColor" /> {customer.averageRating}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {customer.productReviews.length ? (
                          <div className="grid max-w-[360px] gap-2">
                            {customer.productReviews.map((review, index) => (
                              <div key={`${review.product}-${index}`} className="rounded-xl bg-[#fffaf3] p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate text-xs font-black text-black">{review.product}</p>
                                  <span className="inline-flex items-center gap-1 text-xs font-black text-[#e08c4c]">
                                    <Star size={12} fill="currentColor" /> {review.rating}/5
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#6b5d52]">{review.review}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-[#8b7563]">No product reviews yet</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-14 text-center text-sm font-black text-[#8b7563]">
                      No customer login records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
