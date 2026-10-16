import React, { useState } from 'react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'promptpay' | 'truemoney'>('card');
  const [couponCode, setCouponCode] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const basePrice = billingCycle === 'monthly' ? 790 : 6900;
  const discountAmount = basePrice * discountRate;
  const subtotalAfterDiscount = basePrice - discountAmount;
  const vatAmount = subtotalAfterDiscount * 0.07;
  const totalAmount = subtotalAfterDiscount + vatAmount;

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'AETHERIS2026' || code === 'PRO2026') {
      setDiscountRate(0.15); // 15% discount
    } else {
      alert('โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ (ลองใช้ AETHERIS2026)');
    }
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-checkout-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close checkout">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Checkout Header */}
        <div className="checkout-header-bar">
          <div className="checkout-steps">
            <div className="step-item completed">
              <span className="step-badge">1</span>
              <span>เลือกแพ็กเกจ</span>
            </div>
            <span className="material-symbols-outlined step-divider">chevron_right</span>
            <div className="step-item active">
              <span className="step-badge">2</span>
              <span>ชำระเงินและเปิดใช้งาน</span>
            </div>
          </div>
          <div className="security-indicator">
            <span className="material-symbols-outlined text-success">verified_user</span>
            <span>การเชื่อมต่อเข้ารหัส 256-bit SSL</span>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="checkout-grid">
          {/* Left Column: Plan Details & Payment */}
          <div className="checkout-left-col">
            {/* Plan Card */}
            <div className="glass-section plan-overview-card">
              <div className="plan-header-row">
                <div>
                  <div className="plan-tag-row">
                    <span className="tier-pill">SELECTED TIER</span>
                    <span className="speed-pill">
                      <span className="pulse-dot"></span> ประมวลผลเร็วที่สุด
                    </span>
                  </div>
                  <h3 className="plan-main-title">Aetheris Pro Unlimited</h3>
                </div>

                {/* Billing Cycle Switcher */}
                <div className="billing-switcher">
                  <button
                    type="button"
                    className={`billing-tab ${billingCycle === 'monthly' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    รายเดือน
                  </button>
                  <button
                    type="button"
                    className={`billing-tab ${billingCycle === 'annual' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('annual')}
                  >
                    <span>รายปี</span>
                    <span className="badge-save">ลด 2 เดือน</span>
                  </button>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="benefits-section">
                <h4 className="benefits-title">สิทธิประโยชน์ในแพ็กเกจ (INCLUDED WITH PRO)</h4>
                <ul className="benefits-grid">
                  <li>
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                    <span>เข้าถึงโมเดล <strong>Aetheris 2.5 Pro &amp; Deep Neural</strong> ไม่จำกัด</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined text-primary">bolt</span>
                    <span>ความเร็วประมวลผลสูงสุด (Priority Compute Access)</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined text-primary">memory</span>
                    <span>Context Window สูงถึง <strong>200,000 tokens</strong></span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                    <span>สิทธิ์เข้าถึงฟีเจอร์ใหม่ก่อนใคร (Early Access Labs)</span>
                  </li>
                  <li className="col-span-full">
                    <span className="material-symbols-outlined text-primary">developer_mode_tv</span>
                    <span>ฟีเจอร์ <strong>Code Review</strong> อัตโนมัติ, Interactive Data Canvas และ Web Intelligence</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="glass-section payment-methods-section">
              <h4 className="section-title">
                <span className="material-symbols-outlined text-primary">credit_card</span>
                <span>เลือกช่องทางชำระเงิน</span>
              </h4>

              <div className="payment-tabs-row">
                <button
                  type="button"
                  className={`pay-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <span className="material-symbols-outlined">credit_card</span>
                  <span>บัตรเครดิต / เดบิต</span>
                </button>

                <button
                  type="button"
                  className={`pay-method-btn ${paymentMethod === 'promptpay' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('promptpay')}
                >
                  <span className="material-symbols-outlined">qr_code_2</span>
                  <span>PromptPay QR</span>
                </button>

                <button
                  type="button"
                  className={`pay-method-btn ${paymentMethod === 'truemoney' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('truemoney')}
                >
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  <span>TrueMoney / Wallet</span>
                </button>
              </div>

              {/* Card Form */}
              {paymentMethod === 'card' && (
                <form className="payment-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-group">
                    <label className="form-label">ชื่อบนบัตร</label>
                    <input type="text" className="form-input form-input-plain" defaultValue="ALEX MERCER" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หมายเลขบัตร (Card Number)</label>
                    <div className="input-with-icon">
                      <span className="material-symbols-outlined input-icon">credit_card</span>
                      <input type="text" className="form-input" defaultValue="4242 •••• •••• 4242" maxLength={19} required />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">วันหมดอายุ (MM/YY)</label>
                      <input type="text" className="form-input form-input-plain" defaultValue="12/28" maxLength={5} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVC / CVV</label>
                      <input type="password" className="form-input form-input-plain" defaultValue="888" maxLength={4} required />
                    </div>
                  </div>
                </form>
              )}

              {/* PromptPay QR */}
              {paymentMethod === 'promptpay' && (
                <div className="payment-qr-panel">
                  <div className="qr-box">
                    <div className="qr-thai-header">
                      <span className="thai-qr-label">THAI QR PAYMENT</span>
                      <span className="thai-qr-sub">พร้อมเพย์ (PromptPay)</span>
                    </div>
                    <div className="qr-code-svg-wrap">
                      <svg className="qr-code-svg" viewBox="0 0 200 200">
                        <rect width="200" height="200" fill="#ffffff" rx="8" />
                        <rect x="20" y="20" width="40" height="40" fill="#000000" />
                        <rect x="26" y="26" width="28" height="28" fill="#ffffff" />
                        <rect x="32" y="32" width="16" height="16" fill="#000000" />

                        <rect x="140" y="20" width="40" height="40" fill="#000000" />
                        <rect x="146" y="26" width="28" height="28" fill="#ffffff" />
                        <rect x="152" y="32" width="16" height="16" fill="#000000" />

                        <rect x="20" y="140" width="40" height="40" fill="#000000" />
                        <rect x="26" y="146" width="28" height="28" fill="#ffffff" />
                        <rect x="32" y="152" width="16" height="16" fill="#000000" />

                        <rect x="80" y="30" width="15" height="15" fill="#000000" />
                        <rect x="105" y="45" width="20" height="10" fill="#000000" />
                        <rect x="75" y="80" width="50" height="50" fill="#000000" rx="4" />
                        <circle cx="100" cy="105" r="10" fill="#ffffff" />

                        <rect x="140" y="80" width="15" height="40" fill="#000000" />
                        <rect x="25" y="80" width="40" height="15" fill="#000000" />
                        <rect x="140" y="140" width="35" height="35" fill="#000000" />
                      </svg>
                    </div>
                    <div className="qr-timer-note">
                      <span>สแกนเพื่อชำระเงินผ่านแอปธนาคารใดก็ได้</span>
                      <span className="qr-countdown">หมดอายุใน 14:59 น.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TrueMoney */}
              {paymentMethod === 'truemoney' && (
                <div className="payment-truemoney-panel">
                  <div className="form-group">
                    <label className="form-label">เบอร์โทรศัพท์ TrueMoney Wallet</label>
                    <div className="input-with-icon">
                      <span className="material-symbols-outlined input-icon">smartphone</span>
                      <input type="tel" className="form-input" placeholder="08x-xxx-xxxx" defaultValue="089-123-4567" />
                    </div>
                    <span className="input-helper">ระบบจะส่งรหัส OTP ยืนยันไปยังเบอร์โทรศัพท์ของคุณ</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="checkout-right-col">
            <div className="glass-section order-summary-card">
              <h4 className="summary-title">สรุปรายการสั่งซื้อ (Order Summary)</h4>

              <div className="summary-line-item">
                <div>
                  <strong>Aetheris Pro Unlimited</strong>
                  <span className="item-cycle">
                    {billingCycle === 'monthly' ? 'ชำระรายเดือน' : 'ชำระรายปี (ประหยัด 2 เดือน)'}
                  </span>
                </div>
                <span className="item-price">฿{basePrice.toLocaleString()}</span>
              </div>

              {/* Coupon Box */}
              <div className="coupon-box">
                <div className="coupon-input-wrap">
                  <input
                    type="text"
                    placeholder="โค้ดส่วนลด (เช่น AETHERIS2026)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button type="button" className="btn-coupon" onClick={handleApplyCoupon}>
                    ใช้โค้ด
                  </button>
                </div>
                {discountRate > 0 && (
                  <div className="coupon-msg">
                    <span className="material-symbols-outlined text-success">check</span>
                    <span>ใช้โค้ดสำเร็จ ลด 15% (AETHERIS2026)</span>
                  </div>
                )}
              </div>

              {/* Summary Breakdown */}
              <div className="summary-breakdown">
                <div className="breakdown-row">
                  <span>ยอดรวมย่อย</span>
                  <span>฿{basePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {discountRate > 0 && (
                  <div className="breakdown-row">
                    <span className="text-success">ส่วนลดโปรโมชั่น (15%)</span>
                    <span className="text-success">-฿{discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="breakdown-row">
                  <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                  <span>฿{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="breakdown-divider"></div>
                <div className="breakdown-row total-row">
                  <span>ยอดชำระสุทธิ</span>
                  <span className="total-price">฿{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-confirm-checkout"
                disabled={isProcessing}
                onClick={handleConfirm}
              >
                <span className="material-symbols-outlined">lock</span>
                <span>{isProcessing ? 'กำลังดำเนินการเชื่อมต่อธนาคาร...' : 'ยืนยันการชำระเงิน'}</span>
              </button>

              <div className="trust-guarantees">
                <div className="guarantee-item">
                  <span className="material-symbols-outlined text-primary">security</span>
                  <span>รับประกันคืนเงินภายใน 14 วัน หากไม่พึงพอใจ</span>
                </div>
                <div className="guarantee-item">
                  <span className="material-symbols-outlined text-primary">autorenew</span>
                  <span>ยกเลิกเมื่อใดก็ได้ ไม่มีข้อผูกมัด</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
