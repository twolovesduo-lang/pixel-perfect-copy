/**
 * DEMO seed data. Every record is flagged `demo: true` and is fictitious —
 * not real results. Generated relative to the current date on first load.
 */
import { addDays, todayISO } from "@/domain/format";
import type {
  Activity, Brand, DB, Delivery, Evidence, Faucet, Opportunity, Payment, Proposal, Prospect, Sku, SkuStatus, Decision,
} from "@/domain/types";

const BRANDS: [string, string][] = [
  ["PUB Agency", "Agência de performance e social"],
  ["PUB Leads", "Geração de demanda B2B"],
  ["PUB Ecom", "Operação e setup de e-commerce"],
  ["PUB Films", "Produção audiovisual"],
  ["PUB Drone", "Captação aérea"],
  ["PUB Media", "Mídia própria e patrocínios"],
  ["PUB Academy", "Treinamentos e workshops"],
  ["PUB Prototype", "MVPs e protótipos de software"],
  ["PUB Lançamentos", "Lançamentos de infoprodutos"],
];

// brand, name, category, problem, icp, ticket, billing, channel, capacity, status, margin, recurrence
type SkuRow = [number, string, string, string, string, number, string, string, number, SkuStatus, number, boolean];
const SKUS: SkuRow[] = [
  [1, "SDR as a Service", "Geração de demanda", "Agenda comercial vazia", "Clínicas e B2B serviços R$100k+/mês", 3500, "Mensal", "Outbound LinkedIn", 4, "VALIDADO", 60, true],
  [1, "Lista Qualificada de Leads", "Geração de demanda", "Prospecção sem dados", "Times comerciais pequenos", 600, "Avulso", "Indicação + WhatsApp", 8, "PADRONIZADO", 85, false],
  [0, "Gestão de Tráfego Pago", "Performance", "CAC alto e leads ruins", "E-commerces R$50k+/mês", 2800, "Mensal", "Outbound Instagram", 5, "VALIDADO", 50, true],
  [0, "Social Media Express", "Conteúdo", "Perfil parado", "Negócios locais", 1800, "Mensal", "Instagram DM", 6, "VALIDAR", 55, true],
  [2, "Setup de Loja Shopify", "E-commerce", "Loja amadora converte pouco", "Marcas D2C iniciantes", 3000, "Projeto", "Comunidades", 3, "VENDA AGORA", 55, false],
  [2, "Auditoria de Conversão", "E-commerce", "Tráfego sem venda", "E-commerces R$30k+/mês", 900, "Avulso", "Conteúdo LinkedIn", 6, "INVENTARIADO", 80, false],
  [3, "Vídeo Institucional", "Audiovisual", "Marca sem prova visual", "Indústrias e construtoras", 4500, "Projeto", "Outbound e-mail", 2, "VALIDADO", 45, false],
  [3, "Pack de Reels Mensal", "Audiovisual", "Sem conteúdo em vídeo", "Restaurantes e varejo", 1200, "Mensal", "Instagram DM", 4, "PAUSADO", 35, true],
  [4, "Drone para Imóveis", "Captação aérea", "Anúncios de imóvel sem destaque", "Imobiliárias e corretores", 900, "Avulso", "WhatsApp", 2, "VENDA AGORA", 70, false],
  [4, "Inspeção Técnica Aérea", "Captação aérea", "Inspeção cara e lenta", "Engenharia e telhados", 2200, "Projeto", "Outbound e-mail", 2, "DESENVOLVER", 65, false],
  [5, "Patrocínio de Podcast", "Mídia", "Marca sem alcance", "SaaS e fintechs", 2000, "Por episódio", "Outbound LinkedIn", 4, "VALIDAR", 75, false],
  [5, "Newsletter Patrocinada", "Mídia", "Baixo awareness B2B", "Ferramentas B2B", 800, "Por edição", "Inbound", 10, "INVENTARIADO", 90, false],
  [6, "Workshop Vendas Consultivas", "Educação", "Time comercial sem método", "PMEs com 3-10 vendedores", 1500, "Por turma", "Indicação", 3, "VALIDADO", 80, false],
  [6, "Mentoria de Prospecção", "Educação", "Founder vende sozinho", "Founders early-stage", 2500, "Mensal", "Conteúdo LinkedIn", 5, "VALIDAR", 85, true],
  [7, "MVP em 30 dias", "Software", "Ideia sem validação", "Founders com capital semente", 8000, "Projeto", "Indicação", 1, "VENDA AGORA", 50, false],
  [7, "Protótipo Clicável", "Software", "Pitch sem demo", "Startups pré-seed", 2500, "Projeto", "Comunidades", 3, "INVENTARIADO", 70, false],
  [8, "Lançamento Completo", "Infoproduto", "Expert sem estrutura", "Experts 50k+ seguidores", 6000, "Fixo + %", "Outbound Instagram", 1, "VALIDADO", 40, false],
  [8, "Perpétuo de Infoproduto", "Infoproduto", "Vendas só em lançamento", "Experts com produto validado", 3000, "Mensal", "Indicação", 2, "DESENVOLVER", 55, true],
  [0, "CRM Comercial Interno", "Operação", "Processo interno", "PUB Holding", 0, "—", "Interno", 1, "INTERNO", 0, false],
  [1, "Máquina de Reuniões Escalável", "Geração de demanda", "Previsibilidade comercial", "B2B tickets altos", 6000, "Mensal", "Outbound multicanal", 3, "ESCALÁVEL", 62, true],
];

// name, skuIdx, decision, hours, prospect stages
type FaucetRow = [string, number, Decision, number, number[]];
const FAUCETS: FaucetRow[] = [
  ["SDR · Clínicas via LinkedIn", 0, "AUMENTAR", 22, [9, 8, 7, 6, 5, 4, 3, 2, 2]],
  ["Tráfego · E-com via Instagram", 2, "MANTER", 20, [8, 7, 6, 6, 3, 2]],
  ["Vídeo · Construtoras via e-mail", 6, "CORRIGIR", 30, [7, 6, 4, 2]],
  ["Shopify · D2C em comunidades", 4, "REPOSICIONAR", 14, [6, 5, 3, 2, 2]],
  ["Drone · Imobiliárias WhatsApp", 8, "AUMENTAR", 9, [8, 7, 7, 3]],
  ["Workshop · PMEs por indicação", 12, "MANTER", 12, [7, 2, 2, 1]],
  ["Podcast · SaaS via LinkedIn", 10, "CORRIGIR", 16, [2, 1, 0]],
  ["MVP · Founders por indicação", 14, "MANTER", 6, [6, 5]],
  ["Lançamento · Experts Instagram", 16, "CORRIGIR", 40, [7, 4]],
  ["Lista de Leads · WhatsApp", 1, "TRANSFORMAR EM MÁQUINA", 5, [7, 7, 7, 3, 2]],
  ["Social Media · Locais DM", 3, "MANTER", 4, [3, 2, 1]],
  ["Reels · Restaurantes DM", 7, "PAUSAR", 10, [0]],
];

const A = ["Atlas", "Vértice", "Lumen", "Nexo", "Orbe", "Prisma", "Ápice", "Rota", "Solar", "Brava", "Cume", "Delta", "Ímpar", "Jade", "Kora", "Mira"];
const B = ["Clínica", "Digital", "Store", "Engenharia", "Imóveis", "Consultoria", "Labs", "Foods", "Tech", "Educação", "Moda", "Saúde"];
const PEOPLE = ["Marina Lopes", "Rafael Costa", "Juliana Prado", "Diego Matos", "Paula Reis", "André Lima", "Camila Torres", "Felipe Nunes", "Larissa Melo", "Thiago Rocha"];
const ROLES = ["CEO", "Sócio(a)", "Head Comercial", "Diretor(a) de Marketing", "Fundador(a)"];
const PAINS = ["Reclamou de leads ruins no LinkedIn", "Contratando SDR", "Anúncios parados há 30 dias", "Lançou produto novo", "Site com conversão baixa", "Abriu nova unidade", "Post pedindo indicação de fornecedor"];
const OWNERS = ["Ana", "Bruno", "Carla"];

export function createSeed(): DB {
  const today = todayISO();
  const ts = new Date().toISOString();
  const base = (id: string) => ({ id, createdAt: ts, demo: true as const });

  const brands: Brand[] = BRANDS.map(([name, description], i) => ({ ...base(`b${i}`), name, description }));
  const skus: Sku[] = SKUS.map((r, i) => ({
    ...base(`s${i}`), brandId: `b${r[0]}`, name: r[1], category: r[2], problem: r[3], icp: r[4], testTicket: r[5],
    billingModel: r[6], channel: r[7], capacity: r[8], status: r[9], marginPct: r[10], recurrence: r[11],
  }));
  const faucets: Faucet[] = [];
  const prospects: Prospect[] = [];
  const opportunities: Opportunity[] = [];
  const activities: Activity[] = [];
  const proposals: Proposal[] = [];
  const payments: Payment[] = [];
  const deliveries: Delivery[] = [];
  const evidences: Evidence[] = [];
  let n = 0;

  FAUCETS.forEach(([name, skuIdx, decision, hours, stages], fi) => {
    const sku = skus[skuIdx]!;
    const fid = `f${fi}`;
    faucets.push({ ...base(fid), name, skuId: sku.id, icp: sku.icp, channel: sku.channel, decision, notes: "" });
    activities.push({
      ...base(`a-h${fi}`), type: "horas", date: addDays(today, -3), owner: OWNERS[fi % 3]!,
      description: "Horas de operação acumuladas (DEMO)", faucetId: fid, hours,
    });
    stages.forEach((stage, si) => {
      const i = n++;
      const pid = `p${i}`;
      const oid = `o${i}`;
      const company = `${A[i % A.length]!} ${B[(i * 5) % B.length]!}`;
      const owner = OWNERS[i % 3]!;
      const priority = stage >= 5 ? "A" : stage >= 3 ? "B" : "C";
      prospects.push({
        ...base(pid), company, segment: sku.icp.split(" ")[0], site: `${company.toLowerCase().replace(/\s/g, "")}.com.br`,
        instagram: `@${company.toLowerCase().replace(/\s/g, "")}`, decisionMaker: PEOPLE[i % PEOPLE.length]!,
        role: ROLES[i % ROLES.length]!, contact: `(11) 9${String(8000 + i * 37).slice(0, 4)}-${String(1000 + i * 91).slice(0, 4)}`,
        painSignal: PAINS[i % PAINS.length]!, priority, faucetId: fid, nextAction: "", notes: "",
      });
      const nextDate = stage >= 9 ? "" : addDays(today, (si % 4) - 1);
      const nextAction = ["Enviar abordagem", "Qualificar", "Follow-up 1", "Follow-up", "Agendar diagnóstico", "Fazer diagnóstico", "Cobrar decisão da proposta", "Cobrar pagamento", "Acompanhar entrega", "Pedir indicação", "Oferecer expansão"][stage]!;
      opportunities.push({
        ...base(oid), prospectId: pid, faucetId: fid, title: `${sku.name} — ${company}`, stage, owner,
        value: sku.testTicket, nextAction, nextActionDate: nextDate, notes: "",
      });
      const act = (type: Activity["type"], d: number, description: string) =>
        activities.push({ ...base(`a${i}-${type}`), type, date: addDays(today, -d), owner, description, opportunityId: oid, prospectId: pid, faucetId: fid, hours: 0 });
      if (stage >= 2) act("contato", 14 - si, `Abordagem via ${sku.channel}`);
      if (stage >= 3) act("resposta", 12 - si, "Respondeu demonstrando interesse");
      if (stage >= 5) act("diagnóstico", 9 - (si % 3), "Diagnóstico de 30min realizado");
      if (stage >= 6) {
        act("proposta", 6 - (si % 3), `Proposta enviada ${sku.testTicket}`);
        proposals.push({ ...base(`pr${i}`), opportunityId: oid, value: sku.testTicket, date: addDays(today, -(6 - (si % 3))), status: stage >= 7 ? "aceita" : "aberta", notes: "" });
      }
      if (stage >= 7) {
        const pending = stage === 7 && si % 3 === 2;
        payments.push({ ...base(`pg${i}`), opportunityId: oid, amount: sku.testTicket, date: pending ? addDays(today, 2) : addDays(today, -(si % 5)), status: pending ? "pendente" : "pago", method: "PIX" });
        if (!pending) act("pagamento", si % 5, `Pagamento recebido (DEMO)`);
      }
      if (stage >= 7) {
        deliveries.push({ ...base(`d${i}`), opportunityId: oid, title: `Entrega ${sku.name}`, dueDate: addDays(today, stage >= 9 ? -5 : (si % 3) + 0), status: stage >= 9 ? "entregue" : stage === 8 ? "em andamento" : "pendente", critical: stage === 8 && si % 2 === 0 });
      }
      if (stage >= 9) {
        evidences.push({ ...base(`e${i}`), type: "case", prospectId: pid, skuId: sku.id, faucetId: fid, deliveryId: `d${i}`, result: "Cliente reportou aumento de reuniões qualificadas (DEMO)", date: addDays(today, -4), docUrl: "", testimonial: "“Agenda cheia em 3 semanas.” (fictício)", numbers: "+18 reuniões/mês (fictício)" });
      }
    });
  });

  evidences.push({ ...base("e-pay"), type: "pagamento", prospectId: "p40", skuId: "s1", faucetId: "f9", result: "Primeiro pagamento recorrente da lista de leads (DEMO)", date: addDays(today, -2), docUrl: "", testimonial: "", numbers: "R$600 via PIX (fictício)" });

  return {
    version: 1, brands, skus, faucets, prospects, opportunities, activities, proposals, payments, deliveries, evidences,
    dailyLogs: [{ ...base("dl0"), date: addDays(today, -1), owner: "Ana", text: "Fechei 2 listas de leads e mandei 3 propostas de SDR. (DEMO)" }],
    goals: { monthly: 15000, weekly: 3750, daily: 750 },
  };
}
