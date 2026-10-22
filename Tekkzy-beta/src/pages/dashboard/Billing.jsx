import React, { useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiCreditCard, FiRefreshCcw } from 'react-icons/fi';
import { useApi } from '../../context/ApiContext';

const Billing = () => {
  const { getPaymentDetails, pauseSubscription, cancelSubscription } = useApi();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [actionLocks, setActionLocks] = useState({});

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Existing backend endpoint returns invoices; keep fallback support for payments/items.
      const response = await getPaymentDetails();
      const sourceRows = response?.invoices || response?.payments || response?.items || [];
      setRows(Array.isArray(sourceRows) ? sourceRows : []);
    } catch (err) {
      setRows([]);
      setError(err?.message || 'Failed to fetch payment details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const summary = useMemo(() => {
    const totalCount = rows.length;
    const totalAmount = rows.reduce((sum, item) => {
      const amountRaw =
        item?.amount_paid ??
        item?.amount ??
        item?.line_items?.[0]?.amount ??
        0;

      const amountNum = Number(amountRaw);
      return sum + (Number.isFinite(amountNum) ? amountNum : 0);
    }, 0);

    const currency = rows[0]?.currency || 'INR';
    const scale = totalAmount > 9999 ? 100 : 1;

    return {
      totalCount,
      currency,
      totalAmount: totalAmount / scale,
    };
  }, [rows]);

  const formatDate = (value) => {
    if (!value) return '-';
    const epochMs = Number(value) > 9999999999 ? Number(value) : Number(value) * 1000;
    const date = Number.isFinite(epochMs) ? new Date(epochMs) : new Date(value);

    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  const formatAmount = (amountValue, currencyValue = 'INR') => {
    const amountNum = Number(amountValue || 0);
    if (!Number.isFinite(amountNum)) return '-';

    const normalized = amountNum > 9999 ? amountNum / 100 : amountNum;
    return `${currencyValue} ${normalized.toLocaleString()}`;
  };

  const handleSubscriptionAction = async (item, actionType) => {
    const subscriptionId =
      item?.razorpaySubscriptionId ||
      item?.subscriptionId ||
      item?.id ||
      '';
    const paymentId =
      item?.paymentId ||
      item?.razorpayPaymentId ||
      item?.razorpay_payment_id ||
      item?.id ||
      '';

    if (!subscriptionId || !paymentId) {
      setError('subscriptionId or paymentId missing for this record.');
      return;
    }

    const payload = {
      institutionId: item?.institution || 'tekkzy',
      cognitoId: item?.cognitoId,
      subscriptionId,
      paymentId,
    };

    const key = `${actionType}-${paymentId}`;

    try {
      setActionLoadingKey(key);
      setError('');

      if (actionType === 'pause') {
        await pauseSubscription(payload);
        setActionLocks((prev) => ({
          ...prev,
          [paymentId]: { ...prev[paymentId], pause: true },
        }));
      } else {
        await cancelSubscription(payload);
        setActionLocks((prev) => ({
          ...prev,
          [paymentId]: { pause: true, cancel: true },
        }));
      }

      await loadPayments();
    } catch (err) {
      setError(err?.message || `Failed to ${actionType} subscription.`);
    } finally {
      setActionLoadingKey('');
    }
  };

  const resolveBillingPeriod = (item) => {
    const direct = String(item?.billingPeriod || '').toLowerCase();
    if (direct === 'monthly' || direct === 'yearly') return direct;

    const hint = `${item?.paymentType || ''} ${item?.subscriptionType || ''} ${item?.planId || ''}`.toLowerCase();
    if (hint.includes('year') || hint.includes('domain')) return 'yearly';
    return 'monthly';
  };

  const getStatusText = (item) => String(item?.status || (item?.paid ? 'paid' : 'unknown')).toLowerCase();

  const isPauseDisabled = (item, paymentId) => {
    if (Boolean(actionLoadingKey)) return true;
    if (actionLocks[paymentId]?.pause) return true;
    const status = getStatusText(item);
    return status.includes('pause') || status.includes('cancel');
  };

  const isCancelDisabled = (item, paymentId) => {
    if (Boolean(actionLoadingKey)) return true;
    if (actionLocks[paymentId]?.cancel) return true;
    const status = getStatusText(item);
    return status.includes('cancel');
  };

  const deriveRenewDate = (item, paymentDateValue) => {
    const existingRenewDate =
      item?.renewDate ||
      item?.renew_date ||
      item?.current_end ||
      item?.next_billing_at ||
      item?.expire_by;

    if (existingRenewDate) return existingRenewDate;

    if (!paymentDateValue) return null;
    const paymentEpochMs = Number(paymentDateValue) > 9999999999
      ? Number(paymentDateValue)
      : Number(paymentDateValue) * 1000;
    const baseDate = Number.isFinite(paymentEpochMs)
      ? new Date(paymentEpochMs)
      : new Date(paymentDateValue);

    if (Number.isNaN(baseDate.getTime())) return null;

    const renewDate = new Date(baseDate);
    if (resolveBillingPeriod(item) === 'yearly') {
      renewDate.setFullYear(renewDate.getFullYear() + 1);
    } else {
      renewDate.setMonth(renewDate.getMonth() + 1);
    }

    return renewDate.getTime();
  };

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Billing & Payments</h1>
          <p className="text-gray-400">Your verified deployment payment history.</p>
        </div>

        <button
          onClick={loadPayments}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-[#161616] text-gray-200 hover:bg-[#1d1d1d] disabled:opacity-60"
        >
          <FiRefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#131313] p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Payments</p>
          <p className="text-2xl font-semibold text-white mt-1">{summary.totalCount}</p>
        </div>
        <div className="rounded-xl border border-[#2a2a2a] bg-[#131313] p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Amount</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {summary.currency} {summary.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-[#2a2a2a] bg-[#131313] p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-1">Synced</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-700 bg-[#101010]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#171717] text-xs uppercase tracking-wider text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-4">Payment ID</th>
                <th scope="col" className="px-6 py-4">Plan</th>
                <th scope="col" className="px-6 py-4">Amount</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Date</th>
                <th scope="col" className="px-6 py-4">Renew Date</th>
                <th scope="col" className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr className="border-t border-gray-800">
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                    Loading payment details...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr className="border-t border-gray-800">
                  <td colSpan={7} className="px-6 py-10">
                    <div className="flex items-center justify-center gap-2 text-rose-400">
                      <FiAlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !error && rows.length === 0 && (
                <tr className="border-t border-gray-800">
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    No payments found for this user.
                  </td>
                </tr>
              )}

              {!isLoading && !error && rows.map((item) => {
                const paymentId =
                  item?.id ||
                  item?.paymentId ||
                  item?.razorpayPaymentId ||
                  item?.razorpay_payment_id ||
                  '-';

                const plan = item?.planId || item?.line_items?.[0]?.name || item?.paymentType || '-';
                const amount = item?.amount_paid ?? item?.amount ?? item?.line_items?.[0]?.amount;
                const currency = item?.currency || 'INR';
                const status = item?.status || (item?.paid ? 'paid' : 'unknown');
                const date = item?.issued_at || item?.created_at || item?.paymentDate || item?.verifiedAt;
                const renewDate = deriveRenewDate(item, date);
                const pauseDisabled = isPauseDisabled(item, paymentId);
                const cancelDisabled = isCancelDisabled(item, paymentId);

                return (
                  <tr key={`${paymentId}-${date}`} className="border-t border-gray-800 hover:bg-[#151515]">
                    <td className="px-6 py-4 font-medium text-white">{paymentId}</td>
                    <td className="px-6 py-4">{plan}</td>
                    <td className="px-6 py-4">{formatAmount(amount, currency)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/40 bg-emerald-900/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        {String(status).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(date)}</td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(renewDate)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSubscriptionAction(item, 'pause')}
                          disabled={pauseDisabled}
                          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500/10"
                        >
                          {actionLoadingKey === `pause-${paymentId}` ? 'Pausing...' : 'Pause'}
                        </button>
                        <button
                          onClick={() => handleSubscriptionAction(item, 'cancel')}
                          disabled={cancelDisabled}
                          className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-500/10"
                        >
                          {actionLoadingKey === `cancel-${paymentId}` ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* <div className="rounded-xl border border-[#2a2a2a] bg-[#131313] p-4 flex items-center gap-3 text-gray-400">
        <FiCreditCard className="w-5 h-5" />
        Payment details are fetched from the existing user payment API and shown in this dashboard table.
      </div> */}
    </div>
  );
};

export default Billing;
