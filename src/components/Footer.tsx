import React from 'react';
import { TrendingUp, Linkedin, Mail, ExternalLink } from 'lucide-react';

const DATA_SOURCES = [
    { name: 'Finnhub', url: 'https://finnhub.io' },
    { name: 'API Ninjas', url: 'https://api-ninjas.com' },
    { name: 'TAAPI.io', url: 'https://taapi.io' },
    { name: 'Alpha Vantage', url: 'https://www.alphavantage.co' },
];

export default function Footer() {
    return (
        <footer
            className="vw-footer"
            style={{
                background: 'transparent',
                borderTop: '1px solid var(--vw-border)',
                position: 'relative',
                overflow: 'hidden',
                marginTop: 'auto',
            }}
        >
            {/* Accent glow line at top */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '5%',
                    right: '5%',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.3), transparent)',
                }}
            />

            {/* ── Main Footer Content ─────────────────────────────────────────── */}
            <div
                style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '32px 24px 20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '28px',
                }}
                className="footer-grid"
            >
                {/* ── Row 1: Three Columns ────────────────────────────────────── */}
                <div
                    style={{
                        display: 'grid',
                        gap: '28px',
                    }}
                    className="footer-columns"
                >
                    {/* Column 1: Branding */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Logo + Wordmark */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #00d4aa, #00a88a)',
                                    boxShadow: '0 0 14px -3px rgba(0, 212, 170, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <TrendingUp style={{ width: '15px', height: '15px', color: 'white' }} />
                            </div>
                            <span
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em',
                                    color: 'var(--vw-text-primary)',
                                }}
                            >
                                Fund<span style={{ color: 'var(--vw-accent)' }}>ra</span>
                            </span>
                        </div>

                        {/* Tagline */}
                        <p
                            style={{
                                fontSize: '13px',
                                color: 'var(--vw-text-secondary)',
                                lineHeight: '1.6',
                                maxWidth: '280px',
                            }}
                        >
                            Static-data fundamental stock screener for value investors.
                        </p>

                        {/* Creator credit */}
                        <p style={{ fontSize: '13px', color: 'var(--vw-text-tertiary)' }}>
                            Created by{' '}
                            <a
                                href="https://www.linkedin.com/in/tonynguyennn/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="vw-footer-link"
                                style={{
                                    color: 'var(--vw-accent)',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Tony Nguyen
                            </a>
                        </p>
                    </div>

                    {/* Column 2: Data Sources */}
                    <div>
                        <h4
                            style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                color: 'var(--vw-text-tertiary)',
                                marginBottom: '10px',
                            }}
                        >
                            Data Sources
                        </h4>
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px',
                            }}
                        >
                            {DATA_SOURCES.map((source) => (
                                <a
                                    key={source.name}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="vw-footer-chip"
                                    title={source.name}
                                >
                                    {source.name}
                                    <ExternalLink style={{ width: '9px', height: '9px', opacity: 0.5 }} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Contact & Social */}
                    <div>
                        <h4
                            style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                color: 'var(--vw-text-tertiary)',
                                marginBottom: '10px',
                            }}
                        >
                            Contact
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <a
                                href="https://www.linkedin.com/in/tonynguyennn/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="vw-footer-link"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '13px',
                                    color: 'var(--vw-text-secondary)',
                                    textDecoration: 'none',
                                }}
                            >
                                <Linkedin style={{ width: '14px', height: '14px', color: 'var(--vw-blue)' }} />
                                LinkedIn
                            </a>
                            <a
                                href="mailto:tony22.work@gmail.com"
                                className="vw-footer-link"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '13px',
                                    color: 'var(--vw-text-secondary)',
                                    textDecoration: 'none',
                                }}
                            >
                                <Mail style={{ width: '14px', height: '14px', color: 'var(--vw-accent)' }} />
                                tony22.work@gmail.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>



        </footer>
    );
}
