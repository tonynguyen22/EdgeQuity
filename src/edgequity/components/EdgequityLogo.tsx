export default function EdgequityLogo() {
  return (
    <span className="eq-brand-logo" aria-label="Edgequity">
      <svg viewBox="0 0 64 64" role="img" aria-hidden="false" focusable="false">
        <title>Edgequity institutional research shield</title>
        <path
          d="M32 4 54 12v17c0 14.5-8.8 24.6-22 31-13.2-6.4-22-16.5-22-31V12L32 4Z"
          fill="#0b1d33"
        />
        <path
          d="M32 8.6 49.5 15v14c0 11.7-6.6 20-17.5 25.6C21.1 49 14.5 40.7 14.5 29V15L32 8.6Z"
          fill="#122a46"
          stroke="rgba(230,237,244,0.22)"
          strokeWidth="2"
        />
        <rect className="eq-logo-e-stem" x="22" y="18" width="8" height="29" rx="1.5" fill="#dbe6f0" />
        <rect className="eq-logo-e-top" x="22" y="18" width="25" height="7" rx="1.5" fill="#dbe6f0" />
        <rect className="eq-logo-e-mid" x="22" y="30" width="21" height="7" rx="1.5" fill="#dbe6f0" />
        <rect className="eq-logo-e-bottom" x="22" y="42" width="26" height="7" rx="1.5" fill="#dbe6f0" />
        <path d="M18.5 45.5c3.4 3.9 7.9 7 13.5 9.1 5.6-2.1 10.1-5.2 13.5-9.1" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="eq-brand-wordmark" aria-hidden="true">
        <span>Edge</span><span className="eq-brand-wordmark-tail">quity</span>
      </span>
    </span>
  );
}
