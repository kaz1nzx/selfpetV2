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
          <a href="#por-que-selfpet">Por que SelfPet?</a>
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
            Cuide dos pets.<br />
            Tenha o negócio<br />
            <em>sob controle.</em>
          </h1>
          <p>
            Seu dia já é cheio de banhos, tosas e clientes para atender.
            Reúna agenda, histórico dos pets e financeiro em um só lugar
            e tome decisões com os números da sua empresa na mão.
          </p>
          <div className="lp-cta-row">
            <a className="lp-btn big shine" href="#planos">Quero organizar meu pet shop</a>
            <Link className="lp-btn ghost big" href="/cadastro">Conhecer o plano grátis</Link>
          </div>
          <div className="lp-trust">
            Agenda, financeiro e relatórios a partir de R$ 49,90/mês.
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

      <section id="por-que-selfpet" className="lp-reasons">
        <div className="lp-reasons-copy" data-reveal>
          <span className="lp-eyebrow">Sua rotina merece mais organização</span>
          <h2>O cuidado que você tem com os pets também vale para o seu negócio.</h2>
          <p>Entre um atendimento e outro, fica difícil lembrar de tudo. O SelfPet ajuda a transformar a correria em uma rotina que você consegue acompanhar.</p>
          <ul className="lp-reason-list">
            <li><b>Saiba o que vem pela frente.</b><span>Consulte os horários, os serviços e os responsáveis na agenda para preparar o dia de trabalho.</span></li>
            <li><b>Atenda com o histórico à mão.</b><span>Encontre os dados do tutor, as observações do pet e os serviços já realizados antes do próximo atendimento.</span></li>
            <li><b>Enxergue o resultado do mês.</b><span>Acompanhe entradas, despesas e saldo para entender para onde vai o dinheiro da empresa.</span></li>
          </ul>
          <a className="lp-btn shine" href="#planos">Encontrar meu plano</a>
        </div>
        <aside className="lp-workflow" data-reveal aria-labelledby="workflow-title">
          <span className="lp-workflow-label">Da agenda ao financeiro</span>
          <h3 id="workflow-title">Concluiu a tosa?<br />A entrada já está registrada.</h3>
          <p>O valor do serviço vai para o dashboard e para o relatório do mês do agendamento.</p>
          <ol>
            <li><span aria-hidden>01</span><div><b>Tosa agendada</b><small>Serviço cadastrado por R$ 40,00</small></div></li>
            <li><span aria-hidden>02</span><div><b>Atendimento concluído</b><small>Você marca a conclusão na agenda</small></div></li>
            <li><span aria-hidden>03</span><div><b>Entrada no financeiro</b><small>Tosa identificada no relatório mensal</small></div><strong>+ R$ 40,00</strong></li>
          </ol>
          <small className="lp-workflow-note">Exemplo ilustrativo. Recurso incluído no Premium e no Pro.</small>
        </aside>
      </section>

      <section id="recursos" className="lp-features">
        <div className="lp-section-head" data-reveal>
          <span className="lp-eyebrow">Tudo em um painel</span>
          <h2>Menos correria, mais tempo com os pets.</h2>
          <p>Do primeiro cadastro ao fechamento do mês, tenha as informações que ajudam você a cuidar da operação.</p>
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
          <h2>Escolha o próximo passo do seu pet shop.</h2>
          <p>Comece a conhecer o SelfPet no Free ou leve agenda, financeiro e relatórios para a sua rotina com um plano pago.</p>
        </div>
        <div className="lp-plans">
          {PLANS.map((p, i) => (
            <article
              className={`lp-plan${p.featured ? " featured" : ""}`}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` }}
              key={p.name}
            >
              {p.featured && <span className="lp-tag">Agenda + financeiro</span>}
              <h3>{p.name}</h3>
              <p className="lp-plan-description">{p.description}</p>
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
              <a className={`lp-btn ${p.featured ? "shine" : "ghost"} full`} href={p.href} target={p.name === "Free" ? undefined : "_blank"} rel={p.name === "Free" ? undefined : "noopener noreferrer"}>
                {p.cta}
              </a>
              <small className="lp-plan-note">{p.name === "Free" ? "Crie sua conta sem cartão." : "Contratação com nossa equipe pelo WhatsApp."}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-faq" aria-labelledby="faq-title">
        <div className="lp-section-head" data-reveal>
          <span className="lp-eyebrow">Antes de escolher</span>
          <h2 id="faq-title">Um plano que faça sentido para você.</h2>
        </div>
        <div data-reveal>
          {FAQ.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </div>
      </section>

      <section className="lp-final" data-reveal>
        <div className="lp-final-inner">
          <h2>Seu próximo atendimento já pode fazer parte de uma rotina mais organizada.</h2>
          <p>Tenha os horários à vista, o histórico por perto e os números do mês para decidir. Escolha seu plano e dê esse passo com o SelfPet.</p>
          <a className="lp-btn big light shine" href="#planos">Escolher meu plano</a>
          <Link className="lp-final-free" href="/cadastro">Prefere conhecer primeiro? Crie sua conta grátis.</Link>
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
    title: "Conheça cada pet",
    body: "Dados, fotos e observações junto ao cadastro do tutor. Encontre o que precisa para dar continuidade ao cuidado.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6.5" cy="9" r="1.8" /><circle cx="10.2" cy="6" r="1.8" /><circle cx="14" cy="6.2" r="1.8" /><circle cx="17.6" cy="9.3" r="1.8" />
        <path d="M8 17.5c0-2.4 1.8-4.2 4-4.2s4 1.8 4 4.2c0 1.6-1.4 2.4-2.8 2.4-.7 0-1-.4-1.2-.4s-.5.4-1.2.4C9.4 19.9 8 19.1 8 17.5Z" />
      </svg>
    ),
  },
  {
    title: "Prepare o dia de trabalho",
    body: "Veja banhos, tosas e outros serviços no calendário, com o status de cada agendamento. Disponível no Premium e no Pro.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" /><path d="M8.5 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Dê continuidade ao cuidado",
    body: "Consulte os atendimentos registrados por data e saiba quais serviços cada pet já recebeu.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" />
      </svg>
    ),
  },
  {
    title: "Decida com os números",
    body: "No Premium e no Pro, veja entradas, saídas por categoria e saldo mensal para acompanhar a saúde financeira da empresa.",
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
  { value: "2", prefix: "", suffix: "", label: "planos com agenda e financeiro" },
];

function subscriptionLink(plan: string, price: string) {
  return `https://wa.me/5515996656570?text=${encodeURIComponent(`Olá! Quero assinar o plano ${plan} do SelfPet por ${price}/mês. Como posso começar?`)}`;
}

const FAQ = [
  { question: "Por que assinar em vez de ficar no Free?", answer: "O Free permite conhecer o SelfPet e cadastrar até 10 pets. Com o Premium ou o Pro, você também tem agenda de atendimentos, entradas automáticas ao concluir serviços, controle de despesas e relatórios mensais para acompanhar a operação." },
  { question: "Qual a diferença entre Premium e Pro?", answer: "O Premium custa R$ 49,90 por mês e atende uma base de até 50 pets, com agenda, financeiro e relatórios. O Pro custa R$ 99,90 por mês, inclui esses recursos e permite cadastrar pets sem limite. Escolha de acordo com o tamanho da sua base de pets." },
  { question: "Como faço para contratar?", answer: "Clique no botão do plano Premium ou Pro para conversar com nossa equipe pelo WhatsApp e combinar a ativação. Se quiser conhecer o sistema primeiro, crie uma conta no plano Free, sem cartão." },
];

const PLANS = [
  {
    name: "Free",
    description: "Para conhecer o sistema e começar a organizar seus cadastros.",
    price: "R$ 0",
    per: "",
    limit: "Até 10 pets",
    cta: "Começar grátis",
    href: "/cadastro",
    featured: false,
    features: ["Cadastro de clientes e pets", "Fichas com fotos e observações", "Consulta ao histórico dos pets"],
  },
  {
    name: "Premium",
    description: "Para ter a agenda e o financeiro juntos no dia a dia do pet shop.",
    price: "R$ 49,90",
    per: "/mês",
    limit: "Até 50 pets",
    cta: "Quero assinar o Premium",
    href: subscriptionLink("Premium", "R$ 49,90"),
    featured: true,
    features: ["Tudo do Free", "Agenda de atendimentos", "Entrada automática ao concluir serviços", "Controle de entradas e despesas", "Relatórios financeiros mensais"],
  },
  {
    name: "Pro",
    description: "Para ampliar sua base de clientes sem se preocupar com o limite de pets.",
    price: "R$ 99,90",
    per: "/mês",
    limit: "Pets ilimitados",
    cta: "Quero assinar o Pro",
    href: subscriptionLink("Pro", "R$ 99,90"),
    featured: false,
    features: ["Todos os recursos do Premium", "Cadastro de pets sem limite", "Agenda e histórico centralizados", "Financeiro e relatórios mensais"],
  },
];
