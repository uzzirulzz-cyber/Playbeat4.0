import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProofStatus, PaymentProof } from '../../types';
import { FileCheck, CheckCircle2, XCircle, Clock, FileText, AlertCircle, Link2, Search } from 'lucide-react';

const STATUS_META: Record<ProofStatus, { pill: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending_review: { pill: 'admin-pill-amber', label: 'Pending Review', icon: Clock },
  approved: { pill: 'admin-pill-green', label: 'Approved', icon: CheckCircle2 },
  rejected: { pill: 'admin-pill-red', label: 'Rejected', icon: XCircle },
  linked: { pill: 'admin-pill-blue', label: 'Linked to Order', icon: Link2 },
};

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const PaymentProofs: React.FC = () => {
  const { paymentProofs, approvePaymentProof, rejectPaymentProof, currentUser } = useStore();
  const [statusFilter, setStatusFilter] = useState<'all' | ProofStatus>('pending_review');
  const [search, setSearch] = useState('');

  const filtered = paymentProofs.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.customerName.toLowerCase().includes(q) ||
             p.customerEmail.toLowerCase().includes(q) ||
             (p.orderId || '').toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: paymentProofs.length,
    pending: paymentProofs.filter(p => p.status === 'pending_review').length,
    approved: paymentProofs.filter(p => p.status === 'approved').length,
    rejected: paymentProofs.filter(p => p.status === 'rejected').length,
  };

  const handleApprove = (proof: PaymentProof) => {
    approvePaymentProof(proof.id, currentUser.name);
  };

  const handleReject = (proof: PaymentProof) => {
    if (window.confirm(`Reject proof from ${proof.customerName}?`)) {
      rejectPaymentProof(proof.id, currentUser.name);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="admin-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-display">Payment Proofs</h1>
              <p className="text-xs text-gray-500 mt-0.5">Uploaded payment confirmations with OCR extraction and verification workflow.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#1f2937]">
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">Total Proofs</div>
            <div className="text-xl font-bold text-white mt-1">{stats.total}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">Pending Review</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{stats.pending}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">Approved</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{stats.approved}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">Rejected</div>
            <div className="text-xl font-bold text-red-400 mt-1">{stats.rejected}</div>
          </div>
        </div>
      </div>

      {/* Filter + search */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0f141c] border border-[#1f2937]">
          {(['all', 'pending_review', 'approved', 'rejected', 'linked'] as const).map((s) => (
            <button
              key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors ${
                statusFilter === s ? 'bg-amber-500/30 text-amber-300' : 'text-gray-500 hover:text-gray-300'
              }`}
            >{s.replace(/_/g, ' ')}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search customer or order..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-sharp pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 w-full sm:w-72" />
        </div>
      </div>

      {/* Proofs grid */}
      {filtered.length === 0 ? (
        <div className="admin-card p-10 text-center">
          <FileCheck className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No payment proofs match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((proof) => {
            const status = STATUS_META[proof.status];
            const StatusIcon = status.icon;
            const ocrMismatch = proof.ocrExtractedAmount && proof.ocrExtractedAmount !== proof.amount;
            return (
              <div key={proof.id} className="admin-card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0f141c] border border-[#1f2937] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{proof.customerName}</div>
                    <div className="text-[10px] text-gray-500 font-mono truncate">{proof.customerEmail}</div>
                    {proof.orderId && (
                      <div className="text-[10px] text-blue-400 font-mono mt-0.5">Linked: {proof.orderId}</div>
                    )}
                  </div>
                  <span className={`${status.pill} flex items-center gap-1 shrink-0`}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    {status.label}
                  </span>
                </div>

                {/* File info */}
                <div className="p-2.5 rounded-lg bg-[#0f141c] border border-[#1f2937] mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">File</span>
                    <span className="text-[10px] text-gray-500 font-mono">{proof.fileSizeKb} KB</span>
                  </div>
                  <div className="text-[11px] text-gray-300 font-mono truncate">{proof.fileName}</div>
                </div>

                {/* Amount + method */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <div className="text-[9px] uppercase text-gray-500 tracking-wider font-mono">Customer Claimed</div>
                    <div className="text-sm font-bold text-white font-mono">Rs {proof.amount.toLocaleString('en-PK')}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase text-gray-500 tracking-wider font-mono">Method</div>
                    <div className="text-sm font-medium text-gray-300">{proof.method}</div>
                  </div>
                </div>

                {/* OCR extraction */}
                {proof.ocrExtractedAmount && (
                  <div className={`p-2.5 rounded-lg mb-3 text-[10px] ${
                    ocrMismatch ? 'bg-red-500/5 border border-red-500/20 text-red-300' : 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-300'
                  }`}>
                    <div className="flex items-start gap-1.5">
                      {ocrMismatch ? <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <div className="font-bold uppercase tracking-wider">OCR Extracted</div>
                        <div className="font-mono mt-0.5">Amount: Rs {proof.ocrExtractedAmount.toLocaleString('en-PK')}</div>
                        {proof.ocrExtractedReference && <div className="font-mono">Ref: {proof.ocrExtractedReference}</div>}
                        {ocrMismatch && <div className="mt-1 font-bold">⚠ Amount mismatch — verify manually.</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviewer + timestamp */}
                {proof.reviewedBy && (
                  <div className="text-[10px] text-gray-500 font-mono mb-3">
                    Reviewed by {proof.reviewedBy} · {formatDate(proof.reviewedAt!)}
                  </div>
                )}

                {/* Actions */}
                {proof.status === 'pending_review' && (
                  <div className="flex items-center gap-2 pt-3 border-t border-[#1f2937]">
                    <button
                      onClick={() => handleApprove(proof)}
                      className="flex-1 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /><span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(proof)}
                      className="flex-1 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[11px] font-bold uppercase tracking-wider border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /><span>Reject</span>
                    </button>
                  </div>
                )}
                <div className="text-[10px] text-gray-500 font-mono mt-2">
                  Uploaded {formatDate(proof.uploadedAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
