const AdmissionPaymentInstallmentTab = ({ form, handleChange, installmentPlan, paymentModes }) => (
  <>
    <div className="flex items-center gap-2 mb-2">
      <label className="w-32 text-right">Fees</label>
      <input placeholder="Fees" value={form.fees} type="number" className="border p-2 flex-1" readOnly />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <label className="w-32 text-right">Discount</label>
      <input placeholder="Discount" value={form.discount} type="number" onChange={handleChange('discount')} className="border p-2 flex-1" />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <label className="w-32 text-right">Total</label>
      <input placeholder="Total" value={form.total} type="number" className="border p-2 flex-1" readOnly />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <label className="w-32 text-right">Fee Paid</label>
      <input placeholder="Fee Paid" value={form.feePaid} type="number" onChange={handleChange('feePaid')} className="border p-2 flex-1" />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <label className="w-32 text-right">Payment Mode</label>
      <select value={form.paidBy} onChange={handleChange('paidBy')} className="border p-2 flex-1">
        <option value="">-- Select Payment Mode --</option>
        {paymentModes.map(p => (
          <option key={p._id} value={p.uuid}>{p.Account_name}</option>
        ))}
      </select>
    </div>
    <div className="flex items-center gap-2 mb-2">
      <label className="w-32 text-right">Balance</label>
      <input placeholder="Balance" value={form.balance} type="number" className="border p-2 flex-1" readOnly />
    </div>
    
    <div className="flex items-center gap-2 mb-2">
      <label className="w-32 text-right">Installments</label>
      <input placeholder="Installments" value={form.installment} onChange={handleChange('installment')} type="number" min="1" className="border p-2 flex-1" />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <label className="w-32 text-right">EMI Start Date</label>
      <input
        type="date"
        placeholder="EMI Start Date"
        value={form.emiDate}
        onChange={handleChange('emiDate')}
        className="border p-2 flex-1"
      />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <label className="w-32 text-right">EMI</label>
      <input placeholder="EMI" value={form.emi} type="number" className="border p-2 flex-1" readOnly />
    </div>
      {installmentPlan.length > 0 && (
      <div className="overflow-x-auto">
      <table className="min-w-full border mt-2 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1">Due Date</th>
            <th className="border px-2 py-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {installmentPlan.map(p => (
            <tr key={p.installmentNo}>
              <td className="border px-2 py-1 text-center truncate">{p.installmentNo}</td>
              <td className="border px-2 py-1 truncate">{new Date(p.dueDate).toLocaleDateString()}</td>
              <td className="border px-2 py-1 text-right truncate">{p.amount}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      )}
  </>
);

export default AdmissionPaymentInstallmentTab;
