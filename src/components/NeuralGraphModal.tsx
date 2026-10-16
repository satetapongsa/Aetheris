import React from 'react';

interface NeuralGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeuralGraphModal: React.FC<NeuralGraphModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-nodes-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="modal-title-with-icon">
          <span className="material-symbols-outlined text-primary">hub</span>
          <div>
            <h3>Neural Graph Architecture &amp; Reasoning Nodes</h3>
            <p className="text-muted">โครงสร้างการประมวลผลเครือข่ายประสาทแบบเรียลไทม์ของ Aetheris 2.5</p>
          </div>
        </div>

        <div className="neural-graph-visualizer">
          <div className="nodes-canvas-sim">
            <div className="node-pill node-input">
              <span className="node-dot bg-blue"></span>
              <span>User Query &amp; Intent Parsing</span>
            </div>
            <div className="node-arrow">➔</div>
            <div className="node-pill node-thinking active-pulse">
              <span className="node-dot bg-purple"></span>
              <span>Deep Reasoning Engine (2.8s)</span>
            </div>
            <div className="node-arrow">➔</div>
            <div className="node-pill node-retrieval">
              <span className="node-dot bg-cyan"></span>
              <span>Knowledge Graph &amp; Web Mesh</span>
            </div>
            <div className="node-arrow">➔</div>
            <div className="node-pill node-synthesizer">
              <span className="node-dot bg-emerald"></span>
              <span>Synthesis &amp; Code Formatter</span>
            </div>
          </div>

          <div className="node-metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Active Neural Weights</span>
              <span className="metric-num">1.8 Trillion (MoE)</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Inference Cluster</span>
              <span className="metric-num">TPU v5p Superpod</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Attention Span</span>
              <span className="metric-num">1,000,000 Tokens</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">End-to-End Latency</span>
              <span className="metric-num">24.2 ms / token</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
