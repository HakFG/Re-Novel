import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  PenTool, ArrowLeft, Users, Book, ScrollText,
  Clock, Plus, Trash2, Star, BarChart3,
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ObraPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const novelId = parseInt(id);

  if (isNaN(novelId)) notFound();

  const novel = await prisma.novels.findUnique({
    where: { id: novelId },
    include: {
      _count: { select: { personagens: true, capitulos: true, grimorio: true, timeline: true } },
      personagens: { orderBy: { data_criacao: "desc" } },
      grimorio: { orderBy: { id: "desc" } },
      timeline: { orderBy: { capitulo_estimado: "asc" } },
    },
  });

  if (!novel) notFound();

  // ── Server Actions ──────────────────────────────────────────────────────────

  async function createPersonagem(formData: FormData) {
    "use server";
    await prisma.personagens.create({
      data: {
        novel_id: novelId,
        nome: formData.get("nome") as string,
        papel: (formData.get("papel") as string) || null,
        objetivo_neste_volume: (formData.get("objetivo") as string) || null,
        descricao_fisica: (formData.get("descricao_fisica") as string) || null,
        personalidade: (formData.get("personalidade") as string) || null,
      },
    });
    revalidatePath(`/obra/${novelId}`);
    redirect(`/obra/${novelId}?tab=personagens`);
  }

  async function deletePersonagem(formData: FormData) {
    "use server";
    await prisma.personagens.delete({ where: { id: parseInt(formData.get("id") as string) } });
    revalidatePath(`/obra/${novelId}`);
    redirect(`/obra/${novelId}?tab=personagens`);
  }

  async function createGrimorio(formData: FormData) {
    "use server";
    const cap = formData.get("primeira_mencao") as string;
    await prisma.grimorio.create({
      data: {
        novel_id: novelId,
        titulo: formData.get("titulo") as string,
        categoria: (formData.get("categoria") as string) || null,
        conteudo: (formData.get("conteudo") as string) || null,
        primeira_mencao_capitulo: cap ? parseInt(cap) : null,
      },
    });
    revalidatePath(`/obra/${novelId}`);
    redirect(`/obra/${novelId}?tab=grimorio`);
  }

  async function deleteGrimorio(formData: FormData) {
    "use server";
    await prisma.grimorio.delete({ where: { id: parseInt(formData.get("id") as string) } });
    revalidatePath(`/obra/${novelId}`);
    redirect(`/obra/${novelId}?tab=grimorio`);
  }

  async function createTimeline(formData: FormData) {
    "use server";
    const cap = formData.get("capitulo_estimado") as string;
    await prisma.timeline.create({
      data: {
        novel_id: novelId,
        evento_nome: formData.get("evento_nome") as string,
        descricao: (formData.get("descricao") as string) || null,
        capitulo_estimado: cap ? parseInt(cap) : null,
        importancia: parseInt((formData.get("importancia") as string) || "1"),
      },
    });
    revalidatePath(`/obra/${novelId}`);
    redirect(`/obra/${novelId}?tab=timeline`);
  }

  async function deleteTimeline(formData: FormData) {
    "use server";
    await prisma.timeline.delete({ where: { id: parseInt(formData.get("id") as string) } });
    revalidatePath(`/obra/${novelId}`);
    redirect(`/obra/${novelId}?tab=timeline`);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const tabs = [
    { key: "overview",    label: "Visão Geral",  icon: BarChart3,   count: null },
    { key: "personagens", label: "Personagens",  icon: Users,       count: novel._count.personagens },
    { key: "grimorio",    label: "Grimório",      icon: ScrollText,  count: novel._count.grimorio },
    { key: "timeline",    label: "Timeline",      icon: Clock,       count: novel._count.timeline },
  ];

  const papeis = ["Protagonista", "Antagonista", "Aliado", "Rival", "Mentor", "Coadjuvante", "Neutro"];
  const categorias = ["Local", "Sistema de Magia", "Organização", "Item", "Evento", "Lore", "Outro"];

  const papelColor: Record<string, string> = {
    Protagonista:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    Antagonista:   "text-red-400 bg-red-500/10 border-red-500/30",
    Aliado:        "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    Rival:         "text-orange-400 bg-orange-500/10 border-orange-500/30",
    Mentor:        "text-purple-400 bg-purple-500/10 border-purple-500/30",
    Coadjuvante:   "text-blue-400 bg-blue-500/10 border-blue-500/30",
    Neutro:        "text-slate-400 bg-slate-500/10 border-slate-500/30",
  };

  const catColor: Record<string, string> = {
    Local:              "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    "Sistema de Magia": "text-violet-400 bg-violet-500/10 border-violet-500/30",
    Organização:        "text-orange-400 bg-orange-500/10 border-orange-500/30",
    Item:               "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    Evento:             "text-red-400 bg-red-500/10 border-red-500/30",
    Lore:               "text-teal-400 bg-teal-500/10 border-teal-500/30",
    Outro:              "text-slate-400 bg-slate-500/10 border-slate-500/30",
  };

  // ── Field styles (reutilizável) ───────────────────────────────────────────
  const field =
    "w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-slate-600 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 selection:bg-blue-500/30">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 right-1/4 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff08 40px, #ffffff08 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff08 40px, #ffffff08 41px)",
          }}
        />
      </div>

      {/* ── Top Bar ── */}
      <nav className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-1.5 group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Dashboard
          </Link>
          <Link
            href={`/escrita/${novel.id}`}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-950/50"
          >
            <PenTool size={14} /> Modo Foco
          </Link>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* ── Novel Title ── */}
        <div className="mb-10">
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-3 leading-none"
            style={{
              background: "linear-gradient(135deg, #60a5fa 0%, #c084fc 60%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {novel.titulo}
          </h1>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              {novel.genero || "Sem gênero"}
            </span>
            <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              {novel.status || "Em Planejamento"}
            </span>
          </div>
          {novel.sinopse && (
            <p className="text-slate-400 max-w-3xl leading-relaxed">{novel.sinopse}</p>
          )}
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 bg-slate-900/50 border border-slate-800 rounded-xl p-1 w-fit mb-10 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <Link
              key={key}
              href={`/obra/${novelId}?tab=${key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon size={14} />
              {label}
              {count !== null && (
                <span
                  className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                    tab === key ? "bg-blue-500/60" : "bg-slate-800"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB: VISÃO GERAL
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Capítulos",   value: novel._count.capitulos,   icon: Book,       color: "text-purple-400", border: "border-purple-500/20", bg: "from-purple-900/20" },
                { label: "Personagens", value: novel._count.personagens, icon: Users,      color: "text-blue-400",   border: "border-blue-500/20",   bg: "from-blue-900/20" },
                { label: "Grimório",    value: novel._count.grimorio,    icon: ScrollText, color: "text-emerald-400",border: "border-emerald-500/20",bg: "from-emerald-900/20" },
                { label: "Eventos",     value: novel._count.timeline,    icon: Clock,      color: "text-amber-400",  border: "border-amber-500/20",  bg: "from-amber-900/20" },
              ].map(({ label, value, icon: Icon, color, border, bg }) => (
                <div key={label} className={`bg-gradient-to-br ${bg} to-transparent border ${border} rounded-2xl p-5`}>
                  <Icon className={`${color} mb-3`} size={22} />
                  <p className="text-4xl font-black text-white mb-0.5">{value}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-200">Progresso da Obra</h3>
                <span className="text-2xl font-black text-blue-400">{novel.progresso_total || 0}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${novel.progresso_total || 0}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                {novel.capitulos_estimados
                  ? `Meta: ${novel.capitulos_estimados} capítulos estimados`
                  : "Sem meta de capítulos definida"}
              </p>
            </div>

            {/* Quick access */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { tab: "personagens", label: "Gerenciar Personagens", icon: Users,      grad: "from-blue-600 to-blue-700" },
                { tab: "grimorio",    label: "Acessar Grimório",       icon: ScrollText, grad: "from-emerald-700 to-teal-700" },
                { tab: "timeline",    label: "Ver Timeline",           icon: Clock,      grad: "from-amber-600 to-orange-700" },
              ].map(({ tab: t, label, icon: Icon, grad }) => (
                <Link
                  key={t}
                  href={`/obra/${novelId}?tab=${t}`}
                  className={`bg-gradient-to-br ${grad} hover:opacity-90 active:scale-[0.98] p-4 rounded-xl font-semibold text-sm flex items-center gap-2.5 transition-all shadow-lg`}
                >
                  <Icon size={16} /> {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: PERSONAGENS
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "personagens" && (
          <div className="space-y-6">
            {/* Create form */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-slate-200 mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Plus size={13} />
                </span>
                Novo Personagem
              </h3>
              <form action={createPersonagem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Nome *</label>
                  <input name="nome" required placeholder="Nome completo do personagem" className={field} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Papel na História</label>
                  <select name="papel" className={`${field} cursor-pointer`}>
                    <option value="">Selecionar papel...</option>
                    {papeis.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Objetivo no Volume</label>
                  <input name="objetivo" placeholder="O que este personagem deseja?" className={field} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Descrição Física</label>
                  <input name="descricao_fisica" placeholder="Aparência, características..." className={field} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Personalidade</label>
                  <textarea
                    name="personalidade"
                    placeholder="Traços, comportamentos, motivações, medos..."
                    rows={3}
                    className={`${field} resize-none`}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 active:scale-95 px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-900/30"
                  >
                    <Plus size={15} /> Criar Personagem
                  </button>
                </div>
              </form>
            </div>

            {/* Characters list */}
            {novel.personagens.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
                <Users size={36} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Nenhum personagem criado ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {novel.personagens.map((p) => (
                  <div
                    key={p.id}
                    className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-600/80 transition-all"
                  >
                    <form
                      action={deletePersonagem}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </form>

                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-black flex-shrink-0 shadow-md">
                        {p.nome[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white leading-tight">{p.nome}</h4>
                        {p.papel && (
                          <span
                            className={`text-[10px] border px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block ${
                              papelColor[p.papel] || papelColor.Neutro
                            }`}
                          >
                            {p.papel}
                          </span>
                        )}
                      </div>
                    </div>

                    {p.objetivo_neste_volume && (
                      <div className="mb-3 bg-slate-950/50 rounded-xl p-3">
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Objetivo</p>
                        <p className="text-xs text-slate-300 line-clamp-2">{p.objetivo_neste_volume}</p>
                      </div>
                    )}
                    {p.descricao_fisica && (
                      <div className="mb-2">
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Aparência</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{p.descricao_fisica}</p>
                      </div>
                    )}
                    {p.personalidade && (
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Personalidade</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{p.personalidade}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: GRIMÓRIO
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "grimorio" && (
          <div className="space-y-6">
            {/* Create form */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-slate-200 mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="w-6 h-6 rounded-lg bg-emerald-700 flex items-center justify-center">
                  <Plus size={13} />
                </span>
                Nova Entrada no Grimório
              </h3>
              <form action={createGrimorio} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Título *</label>
                  <input name="titulo" required placeholder="Nome do local, item, sistema..." className={field} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Categoria</label>
                  <select name="categoria" className={`${field} cursor-pointer`}>
                    <option value="">Selecionar...</option>
                    {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Primeira Menção (Cap.)</label>
                  <input name="primeira_mencao" type="number" min={1} placeholder="Nº do capítulo" className={field} />
                </div>
                <div className="md:col-span-2 row-span-1">
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Descrição / Conteúdo</label>
                  <textarea
                    name="conteudo"
                    placeholder="Detalhes, regras, história, lore..."
                    rows={3}
                    className={`${field} resize-none`}
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-600 active:scale-95 px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                  >
                    <Plus size={15} /> Adicionar ao Grimório
                  </button>
                </div>
              </form>
            </div>

            {/* Entries */}
            {novel.grimorio.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
                <ScrollText size={36} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Grimório vazio. Adicione locais, sistemas de magia e lore.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {novel.grimorio.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex gap-4 bg-slate-900/40 border border-slate-800 rounded-xl p-4 hover:border-slate-600/80 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h4 className="font-bold text-white">{entry.titulo}</h4>
                        {entry.categoria && (
                          <span
                            className={`text-[10px] border px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              catColor[entry.categoria] || catColor.Outro
                            }`}
                          >
                            {entry.categoria}
                          </span>
                        )}
                        {entry.primeira_mencao_capitulo && (
                          <span className="text-[10px] text-slate-600">
                            → Cap. {entry.primeira_mencao_capitulo}
                          </span>
                        )}
                      </div>
                      {entry.conteudo && (
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{entry.conteudo}</p>
                      )}
                    </div>
                    <form
                      action={deleteGrimorio}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center"
                    >
                      <input type="hidden" name="id" value={entry.id} />
                      <button className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: TIMELINE
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "timeline" && (
          <div className="space-y-6">
            {/* Create form */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-slate-200 mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="w-6 h-6 rounded-lg bg-amber-700 flex items-center justify-center">
                  <Plus size={13} />
                </span>
                Novo Evento
              </h3>
              <form action={createTimeline} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Nome do Evento *</label>
                  <input
                    name="evento_nome"
                    required
                    placeholder="Ex: Batalha do Norte, Traição revelada..."
                    className={field}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Capítulo Estimado</label>
                  <input name="capitulo_estimado" type="number" min={1} placeholder="Nº do cap." className={field} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Descrição</label>
                  <textarea
                    name="descricao"
                    placeholder="O que acontece, quem está envolvido, impacto..."
                    rows={2}
                    className={`${field} resize-none`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1.5 uppercase tracking-widest">Importância</label>
                  <select name="importancia" className={`${field} cursor-pointer`}>
                    <option value="1">⭐ Menor</option>
                    <option value="2">⭐⭐ Moderado</option>
                    <option value="3">⭐⭐⭐ Crucial</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="bg-amber-700 hover:bg-amber-600 active:scale-95 px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                  >
                    <Plus size={15} /> Adicionar Evento
                  </button>
                </div>
              </form>
            </div>

            {/* Timeline list */}
            {novel.timeline.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
                <Clock size={36} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Timeline vazia. Marque os momentos-chave da história.</p>
              </div>
            ) : (
              <div className="relative pl-2">
                {/* Vertical line */}
                <div className="absolute left-[30px] top-7 bottom-7 w-px bg-gradient-to-b from-slate-700 via-slate-700/50 to-transparent" />

                <div className="space-y-3">
                  {novel.timeline.map((event) => {
                    const imp = event.importancia || 1;
                    const dotStyle =
                      imp === 3 ? "border-red-500 bg-red-950/70 shadow-red-900/50" :
                      imp === 2 ? "border-amber-500 bg-amber-950/70 shadow-amber-900/50" :
                                  "border-slate-600 bg-slate-900";
                    const cardBorder =
                      imp === 3 ? "border-red-500/20 hover:border-red-500/40" :
                      imp === 2 ? "border-amber-500/15 hover:border-amber-500/30" :
                                  "border-slate-800 hover:border-slate-600/80";
                    const stars = "⭐".repeat(imp);

                    return (
                      <div key={event.id} className="group flex gap-4 items-start">
                        {/* Node */}
                        <div
                          className={`w-[56px] h-[56px] rounded-full border-2 flex-shrink-0 flex flex-col items-center justify-center z-10 shadow-lg transition-all ${dotStyle}`}
                        >
                          {event.capitulo_estimado ? (
                            <>
                              <p className="text-[8px] text-slate-500 leading-none">CAP</p>
                              <p className="text-sm font-black text-slate-200 leading-tight">
                                {event.capitulo_estimado}
                              </p>
                            </>
                          ) : (
                            <span className="text-slate-600 text-xs">?</span>
                          )}
                        </div>

                        {/* Card */}
                        <div
                          className={`flex-1 bg-slate-900/40 border rounded-xl p-4 transition-all ${cardBorder}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-white">{event.evento_nome}</h4>
                                <span className="text-xs">{stars}</span>
                              </div>
                              {event.descricao && (
                                <p className="text-sm text-slate-400 leading-relaxed">{event.descricao}</p>
                              )}
                            </div>
                            <form
                              action={deleteTimeline}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <input type="hidden" name="id" value={event.id} />
                              <button className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                                <Trash2 size={13} />
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}