import { useContext, useEffect, useMemo, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import MoveUpOnRender from "../../components/MoveUpOnRender";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

const paymentStatusClass = (status) => {
  if (status === "completed") return "text-green-600 bg-green-50";
  if (status === "failed") return "text-red-600 bg-red-50";
  return "text-amber-600 bg-amber-50";
};

const AllPayments = () => {
  const { aToken, payments, getAllPayments } = useContext(AdminContext);
  const { currency } = useContext(AppContext);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (aToken) {
      getAllPayments();
    }
  }, [aToken]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;

    return payments.filter(
      (p) =>
        p.patientName?.toLowerCase().includes(q) ||
        p.patientEmail?.toLowerCase().includes(q) ||
        p.doctorName?.toLowerCase().includes(q) ||
        p.stripeSessionId?.toLowerCase().includes(q) ||
        p.paymentType?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString();
  };

  return (
    <div className="w-full max-w-7xl m-5">
      <MoveUpOnRender id="admin-all-payments">
        <div className="bg-white rounded border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-b">
            <div>
              <p className="text-lg font-medium">Payment Transactions</p>
              <span className="text-xs text-gray-400">
                {filteredPayments.length} transaction(s)
              </span>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, doctor, status..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="text-sm max-h-[80vh] min-h-[60vh] overflow-y-auto overflow-x-auto">
            <div className="hidden lg:grid lg:grid-cols-[1.6fr_1.6fr_1.2fr_0.8fr_0.8fr_0.7fr_1fr_1.2fr] items-center py-3 px-4 border-b font-medium text-gray-700 bg-gray-50 sticky top-0 min-w-[1000px]">
              <p>Patient</p>
              <p>Doctor</p>
              <p>Email</p>
              <p>Type</p>
              <p>Amount</p>
              <p>Status</p>
              <p>Paid at</p>
              <p>Session ID</p>
            </div>

            {filteredPayments.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap lg:grid lg:grid-cols-[1.6fr_1.6fr_1.2fr_0.8fr_0.8fr_0.7fr_1fr_1.2fr] gap-2 lg:gap-0 items-center text-gray-600 py-3 px-4 border-b hover:bg-gray-50 min-w-[1000px]"
              >
                <div>
                  <p className="font-medium text-gray-800 capitalize">
                    {item.patientName}
                  </p>
                  {item.userDeleted && (
                    <p className="text-[10px] text-gray-400">Deleted account</p>
                  )}
                </div>
                <p className="capitalize">{item.doctorName}</p>
                <p className="text-xs truncate">{item.patientEmail}</p>
                <p className="capitalize text-xs">{item.paymentType}</p>
                <p className="font-medium text-gray-800">
                  {currency}
                  {item.amount}
                  <span className="text-gray-400 text-[10px] ml-0.5 uppercase">
                    {item.currency}
                  </span>
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded w-fit capitalize ${paymentStatusClass(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
                <p className="text-xs">{formatDate(item.paidAt || item.createdAt)}</p>
                <p
                  className="text-[10px] text-gray-400 truncate font-mono"
                  title={item.stripeSessionId}
                >
                  {item.stripeSessionId}
                </p>
              </div>
            ))}

            {filteredPayments.length === 0 && (
              <p className="p-8 text-center text-gray-400">
                {search.trim()
                  ? "No transactions match your search"
                  : "No payment transactions yet"}
              </p>
            )}
          </div>
        </div>
      </MoveUpOnRender>
    </div>
  );
};

export default AllPayments;
