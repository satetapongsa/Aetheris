import React from 'react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-analytics-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close analytics">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="modal-title-with-icon">
          <span className="material-symbols-outlined text-primary">analytics</span>
          <div>
            <h3>Performance &amp; Token Consumption Analytics</h3>
            <p className="text-muted">สถิติความเร็วการประมวลผลและการใช้โทเค็นในเซสชันนี้</p>
          </div>
        </div>

        <div className="analytics-charts-grid">
          <div className="analytics-card">
            <span className="analytics-card-title">Token Usage Breakdown</span>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: '18%' }}></div>
            </div>
            <div className="progress-legend">
              <span>Prompt: 142 tokens</span>
              <span>Completion: 894 tokens</span>
              <span>Total: 1,036 / 200,000</span>
            </div>
          </div>

          <div className="analytics-card">
            <span className="analytics-card-title">Response Latency Profile</span>
            <div className="latency-bars">
              <div className="bar-col" style={{ height: '40%' }} title="TTFT: 120ms">
                <span>TTFT</span>
              </div>
              <div className="bar-col" style={{ height: '75%' }} title="Reasoning: 2800ms">
                <span>Reasoning</span>
              </div>
              <div className="bar-col active-bar" style={{ height: '90%' }} title="Streaming: 18ms/tok">
                <span>Gen</span>
              </div>
              <div className="bar-col" style={{ height: '30%' }} title="Evaluation: 45ms">
                <span>Eval</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
