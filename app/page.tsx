"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Home() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealAll = () => {
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.classList.add("in");
        el.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => countUp(c, reduce));
      });
    };

    // Older browsers: no scroll effect, just show everything.
    if (typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    // Reveal on scroll + count-up
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("in");
          el.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => countUp(c, reduce));
          io.unobserve(el);
        }
      },
      { threshold: 0.18 }
    );
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => io.observe(el));

    // Cursor spotlight + 3D tilt on the hero stage
    const stage = root.querySelector<HTMLElement>(".lp-stage");
    const onMove = (e: PointerEvent) => {
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
      stage.style.setProperty("--ry", `${(px * 9).toFixed(2)}deg`);
      stage.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
      stage.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
    };
    const onLeave = () => {
      stage?.style.setProperty("--rx", "0deg");
      stage?.style.setProperty("--ry", "0deg");
    };
    if (!reduce && stage) {
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerleave", onLeave);
    }

    return () => {
      io.disconnect();
      stage?.removeEventListener("pointermove", onMove);
      stage?.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <main className="lp" ref={rootRef}>
      <noscript>
        <style>{`.lp [data-reveal]{opacity:1 !important;transform:none !important}`}</style>
      </noscript>
      <div className="lp-aurora" aria-hidden>
        <span className="lp-blob b1" />
        <span className="lp-blob b2" />
        <span className="lp-blob b3" />
      </div>

      <header className="lp-nav">
        <Link href="/" className="lp-logo" aria-label="SelfPet">
          <img src="/logo.png" alt="SelfPet" />
          <span>SelfPet</span>
        </Link>
        <nav className="lp-nav-links">
          <a href="#recursos">Recursos</a>
          <a href="#planos">Planos</a>
        </nav>
        <div className="lp-nav-actions">
          <Link className="lp-btn ghost" href="/login">Entrar</Link>
          <Link className="lp-btn shine" href="/cadastro">Começar grátis</Link>
        </div>
      </header>

      <section className="lp-hero lp-stage">
        <div className="lp-hero-copy" data-reveal>
          <span className="lp-pill">
            <i className="lp-paw" aria-hidden>🐾</i> Gestão pet, sem planilha
          </span>
          <h1>
            O jeito <em>carinhoso</em> de<br />
            organizar o seu petshop.
          </h1>
          <p>
            Cadastre pets e tutores, agende banhos e tosas e tenha o histórico de
            cada bichinho na palma da mão. Simples assim.
          </p>
          <div className="lp-cta-row">
            <Link className="lp-btn big shine" href="/cadastro">Criar conta grátis</Link>
            <Link className="lp-btn ghost big" href="/login">Já tenho conta</Link>
          </div>
          <div className="lp-trust">
            <span className="lp-stars" aria-hidden>★★★★★</span>
            Feito com carinho para quem cuida de pets todos os dias.
          </div>
        </div>

        <div className="lp-hero-visual" data-reveal>
          <div className="lp-photo">
            <img src="/dono.png" alt="Tutor e seu cachorro" />
            <div className="lp-chip lp-chip-a">
              <span className="lp-avatar">T</span>
              <div>
                <b>Thor · Golden</b>
                <small>Banho concluído ✓</small>
              </div>
            </div>
            <div className="lp-chip lp-chip-b">
              <div className="lp-chip-icon">📅</div>
              <div>
                <b>Hoje</b>
                <small><strong data-count="8">0</strong> atendimentos</small>
              </div>
            </div>
            <div className="lp-ring">
              <strong data-count="37">0</strong>
              <small>pets ativos</small>
            </div>
          </div>
        </div>
      </section>

      <div className="lp-marquee" aria-hidden>
        <div className="lp-marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>
              Banho &amp; Tosa <b>·</b> Clínica Veterinária <b>·</b> Pet Shop <b>·</b> Creche
              <b>·</b> Hotelzinho <b>·</b> Adestramento <b>·</b> Day Care <b>·</b>&nbsp;
            </span>
          ))}
        </div>
      </div>

      <section id="recursos" className="lp-features">
        <div className="lp-section-head" data-reveal>
          <span className="lp-eyebrow">Tudo em um painel</span>
          <h2>Menos correria, mais tempo com os pets.</h2>
          <p>Cada recurso pensado para quem vive o dia a dia do banho, da tosa e do balcão.</p>
        </div>
        <div className="lp-grid">
          {FEATURES.map((f, i) => (
            <article className="lp-card" data-reveal style={{ transitionDelay: `${i * 70}ms` }} key={f.title}>
              <span className="lp-card-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-stats" data-reveal>
        {STATS.map((s) => (
          <div className="lp-stat" key={s.label}>
            <strong>
              {s.prefix}
              <span data-count={s.value}>0</span>
              {s.suffix}
            </strong>
            <small>{s.label}</small>
          </div>
        ))}
      </section>

      <section id="planos" className="lp-pricing">
        <div className="lp-section-head" data-reveal>
          <span className="lp-eyebrow">Planos</span>
          <h2>Comece grátis. Cresça no seu ritmo.</h2>
          <p>Sem cartão para começar. Mude de plano quando a sua base de pets crescer.</p>
        </div>
        <div className="lp-plans">
          {PLANS.map((p, i) => (
            <article
              className={`lp-plan${p.featured ? " featured" : ""}`}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` }}
              key={p.name}
            >
              {p.featured && <span className="lp-tag">Mais popular</span>}
              <h3>{p.name}</h3>
              <div className="lp-price">
                <b>{p.price}</b>
                {p.per && <span>{p.per}</span>}
              </div>
              <p className="lp-limit">{p.limit}</p>
              <ul>
                {p.features.map((feat) => (
                  <li key={feat}>{feat}</li>
                ))}
              </ul>
              <Link className={`lp-btn ${p.featured ? "shine" : "ghost"} full`} href="/cadastro">
                {p.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-final" data-reveal>
        <div className="lp-final-inner">
          <h2>Pronto para deixar as planilhas no passado?</h2>
          <p>Crie a conta da sua empresa em minutos e comece a cuidar dos pets com organização.</p>
          <Link className="lp-btn big light shine" href="/cadastro">Começar gratuitamente</Link>
        </div>
      </section>

      <footer className="lp-footer">
        <Link href="/" className="lp-logo">
          <img src="/logo.png" alt="SelfPet" />
          <span>SelfPet</span>
        </Link>
        <p>© {new Date().getFullYear()} SelfPet · Feito para negócios do mercado pet.</p>
      </footer>
    </main>
  );
}

function countUp(el: HTMLElement, reduce: boolean) {
  const target = Number(el.dataset.count || "0");
  if (reduce || !target) {
    el.textContent = String(target);
    return;
  }
  const dur = 1100;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const FEATURES = [
  {
    title: "Pets & tutores",
    body: "Fichas completas com foto, raça, porte e observações de cada bichinho.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6.5" cy="9" r="1.8" /><circle cx="10.2" cy="6" r="1.8" /><circle cx="14" cy="6.2" r="1.8" /><circle cx="17.6" cy="9.3" r="1.8" />
        <path d="M8 17.5c0-2.4 1.8-4.2 4-4.2s4 1.8 4 4.2c0 1.6-1.4 2.4-2.8 2.4-.7 0-1-.4-1.2-.4s-.5.4-1.2.4C9.4 19.9 8 19.1 8 17.5Z" />
      </svg>
    ),
  },
  {
    title: "Agenda inteligente",
    body: "Marque atendimentos, veja o dia por completo e nunca perca um horário.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" /><path d="M8.5 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Histórico do pet",
    body: "Todo banho, tosa e consulta registrados por data, sempre à mão.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" />
      </svg>
    ),
  },
  {
    title: "Serviços & valores",
    body: "Monte seu cardápio de serviços e acompanhe o financeiro sem esforço.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13.5 10.5 20a2 2 0 0 0 2.8 0l6.7-6.7a2 2 0 0 0 .6-1.4V5.5a1.5 1.5 0 0 0-1.5-1.5h-6a2 2 0 0 0-1.4.6L4.6 11a2 2 0 0 0 0 2.5Z" /><circle cx="15.5" cy="8.5" r="1.2" />
      </svg>
    ),
  },
];

const STATS = [
  { value: "0", prefix: "R$", suffix: "", label: "para começar no plano Free" },
  { value: "50", prefix: "", suffix: "", label: "pets no plano Premium" },
  { value: "1", prefix: "", suffix: "", label: "painel para toda a operação" },
  { value: "3", prefix: "", suffix: " min", label: "para configurar a sua conta" },
];

const PLANS = [
  {
    name: "Free",
    price: "R$ 0",
    per: "",
    limit: "Até 10 pets",
    cta: "Começar grátis",
    featured: false,
    features: ["Cadastro de clientes e pets", "Histórico de atendimentos", "1 usuário"],
  },
  {
    name: "Premium",
    price: "R$ 29,90",
    per: "/mês",
    limit: "Até 50 pets",
    cta: "Assinar Premium",
    featured: true,
    features: ["Tudo do Free", "Agenda de atendimentos", "Serviços e valores", "Suporte prioritário"],
  },
  {
    name: "Pro",
    price: "R$ 79,90",
    per: "/mês",
    limit: "Pets ilimitados",
    cta: "Assinar Pro",
    featured: false,
    features: ["Tudo do Premium", "Vários funcionários", "Painel financeiro", "Relatórios"],
  },
];
