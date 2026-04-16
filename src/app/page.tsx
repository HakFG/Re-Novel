import { prisma } from "@/lib/prisma";
import { Plus, BookOpen, Trash2, Feather, TrendingUp, CheckCircle, Clock, Star, Target, Edit2, Calendar, BarChart3, Zap, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createNovel, deleteNovel, updateNovel, getNovelStats } from "@/lib/actions";
import { EditNovelButtons } from "@/components/EditNovelButtons";
import { EditSinopse } from "@/components/EditSinopse";
import { RefreshButton } from "@/components/RefreshButton";

// Tipo para a novel com stats
type NovelWithStats = Awaited<ReturnType<typeof prisma.novels.findUnique>> & {
  _count: {
    capitulos: number;
    personagens: number;
    grimorio: number;
    timeline: number;
  };
  stats?: {
    totalCapitulos: number;
    totalPersonagens: number;
    totalGrimorio: number;
    totalTimeline: number;
    totalPalavras: number;
    capitulosPorStatus: Array<{ status: string | null; count: number }>;
  };
};

export default async function Dashboard() {
  const allNovelsRaw = await prisma.novels.findMany({
    orderBy: { data_criacao: "desc" },
    include: {
      _count: { select: { personagens: true, capitulos: true, grimorio: true, timeline: true } },
    },
  });

  // Buscar estatísticas avançadas para cada novel
  const novelsWithStats: NovelWithStats[] = await Promise.all(
    allNovelsRaw.map(async (novel) => {
      const stats = await getNovelStats(novel.id);
      return { ...novel, stats };
    })
  );

  const generoGradient: Record<string, string> = {
    Fantasia: "from-violet-500 to-indigo-600",
    "Sci-Fi": "from-cyan-500 to-blue-600",
    Terror: "from-red-600 to-rose-800",
    Romance: "from-pink-500 to-rose-500",
  };

  const statusStyle: Record<string, { dot: string; label: string; bg: string }> = {
    "Em Planejamento": { dot: "bg-amber-400", label: "text-amber-400", bg: "bg-amber-500/10" },
    Ativa: { dot: "bg-emerald-400", label: "text-emerald-400", bg: "bg-emerald-500/10" },
    Hiato: { dot: "bg-orange-400", label: "text-orange-400", bg: "bg-orange-500/10" },
    Concluída: { dot: "bg-blue-400", label: "text-blue-400", bg: "bg-blue-500/10" },
  };

  // Estatísticas globais avançadas
  const totalCaps = novelsWithStats.reduce((a, n) => a + n._count.capitulos, 0);
  const totalPalavras = novelsWithStats.reduce((a, n) => a + (n.stats?.totalPalavras || 0), 0);
  const ativas = novelsWithStats.filter((n) => n.status === "Ativa" || n.status === "Em Planejamento").length;
  const concluidas = novelsWithStats.filter((n) => n.status === "Concluída").length;
  const metaTotal = novelsWithStats.reduce((a, n) => a + (n.capitulos_estimados || 0), 0);
  const progressoGlobal = metaTotal > 0 ? Math.floor((totalCaps / metaTotal) * 100) : 0;

  // Obra com mais progresso
  const obraTop = [...novelsWithStats].sort((a, b) => (b.progresso_total || 0) - (a.progresso_total || 0))[0];

  return (
    <main className="min-h-screen bg-[#07090f] text-slate-100 selection:bg-blue-500/30">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff08 40px, #ffffff08 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff08 40px, #ffffff08 41px)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* ── Header ── */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-14">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 rounded-full" />
                <Feather className="relative text-blue-400" size={28} />
              </div>
              <h1
                className="text-6xl font-black tracking-tighter"
                style={{
                  background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #60a5fa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundSize: "200% auto",
                }}
              >
                RE:NOVEL
              </h1>
            </div>
            <p className="text-slate-500 text-sm tracking-widest uppercase font-medium ml-11">
              {novelsWithStats.length} obra{novelsWithStats.length !== 1 ? "s" : ""} no multiverso
            </p>
          </div>

          {/* Create form */}
          <form
            action={createNovel}
            className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl shadow-black/50"
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-3 font-bold">
              ✦ Nova Obra
            </p>
            <div className="flex gap-2">
              <input
                name="titulo"
                placeholder="Título da obra..."
                required
                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none w-60 placeholder:text-slate-600 transition-all"
              />
              <select
                name="genero"
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-300 cursor-pointer focus:border-blue-500 transition-all"
              >
                <option value="Fantasia">Fantasia</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Terror">Terror</option>
                <option value="Romance">Romance</option>
                <option value="Suspense">Suspense</option>
                <option value="Aventura">Aventura</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/40 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          </form>
        </header>

        {/* ── Stats Bar Avançada ── */}
        {novelsWithStats.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { icon: BookOpen, value: totalCaps, label: "Capítulos", color: "text-blue-400", suffix: "" },
                { icon: TrendingUp, value: totalPalavras.toLocaleString("pt-BR"), label: "Palavras", color: "text-purple-400", suffix: "" },
                { icon: Target, value: `${progressoGlobal}%`, label: "Progresso Global", color: "text-emerald-400", suffix: "" },
                { icon: Star, value: obraTop?.titulo?.slice(0, 15) || "-", label: "Destaque da Semana", color: "text-yellow-400", suffix: "" },
              ].map(({ icon: Icon, value, label, color, suffix }) => (
                <div
                  key={label}
                  className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3 group hover:border-slate-700 transition-all"
                >
                  <Icon size={18} className={color} />
                  <div>
                    <p className="text-xl font-black text-white">{value}{suffix}</p>
                    <p className="text-[11px] text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-12">
              {[
                { icon: CheckCircle, value: concluidas, label: "Concluídas", color: "text-emerald-400" },
                { icon: Zap, value: ativas, label: "Em Andamento", color: "text-amber-400" },
                { icon: AlertCircle, value: novelsWithStats.filter(n => n.status === "Hiato").length, label: "Em Hiato", color: "text-orange-400" },
              ].map(({ icon: Icon, value, label, color }) => (
                <div
                  key={label}
                  className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3"
                >
                  <Icon size={18} className={color} />
                  <div>
                    <p className="text-xl font-black text-white">{value}</p>
                    <p className="text-[11px] text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Novels Grid Melhorada ── */}
        {novelsWithStats.length === 0 ? (
          <div className="text-center py-36">
            <p className="text-6xl mb-5">📖</p>
            <h2 className="text-2xl font-bold text-slate-500 mb-2">Página em branco</h2>
            <p className="text-slate-600 text-sm">Crie sua primeira obra acima para começar</p>
          </div>
        ) : (
          <>
            {/* Botão de atualização rápida */}
            <div className="flex justify-end mb-4">
              <RefreshButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {novelsWithStats.map((novel) => {
                const grad = generoGradient[novel.genero || ""] || "from-blue-500 to-purple-600";
                const st = statusStyle[novel.status || ""] || statusStyle["Em Planejamento"];
                const mediaPalavras = (novel.stats?.totalCapitulos || 0) > 0 
                  ? Math.floor((novel.stats?.totalPalavras || 0) / (novel.stats?.totalCapitulos || 1))
                  : 0;
                const tempoLeitura = Math.ceil((novel.stats?.totalPalavras || 0) / 200);
                
                return (
                  <div
                    key={novel.id}
                    className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-600/80 transition-all duration-300 backdrop-blur-sm flex flex-col overflow-hidden"
                  >
                    {/* Top accent line */}
                    <div
                      className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${grad} opacity-50 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    {/* Actions buttons - Client Component */}
                    <EditNovelButtons 
                      novelId={novel.id}
                      tituloAtual={novel.titulo}
                      sinopseAtual={novel.sinopse}
                    />

                    {/* Card header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-xl flex-shrink-0 shadow-lg`}
                      >
                        📚
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-base truncate group-hover:text-blue-300 transition-colors">
                          {novel.titulo}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {novel.genero}
                          </span>
                          <span className="text-slate-700">·</span>
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            <span className={`text-[10px] uppercase tracking-wider font-medium ${st.label}`}>
                              {novel.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sinopse editável - Client Component */}
                    <EditSinopse 
                      novelId={novel.id}
                      sinopseAtual={novel.sinopse}
                    />

                    {/* Stats detalhados */}
                    <div className="grid grid-cols-4 gap-1.5 mb-4">
                      {[
                        { v: novel._count.capitulos, l: "Cap.", color: "text-blue-400" },
                        { v: novel._count.personagens, l: "Pers.", color: "text-purple-400" },
                        { v: novel._count.grimorio, l: "Grim.", color: "text-emerald-400" },
                        { v: novel._count.timeline, l: "Even.", color: "text-amber-400" },
                      ].map(({ v, l, color }) => (
                        <div key={l} className="bg-slate-950/60 rounded-lg py-2 text-center">
                          <p className="text-base font-black text-white leading-none">{v}</p>
                          <p className={`text-[9px] mt-0.5 ${color}`}>{l}</p>
                        </div>
                      ))}
                    </div>

                    {/* Métricas extras */}
                    <div className="flex justify-between text-[9px] text-slate-600 mb-4">
                      <span>📊 Média: {mediaPalavras.toLocaleString("pt-BR")} palavras/cap</span>
                      <span>⏱️ {tempoLeitura} min de leitura</span>
                    </div>

                    {/* Progresso com meta */}
                    <div className="mb-5">
                      <div className="flex justify-between text-[9px] text-slate-600 mb-1">
                        <span>Progresso</span>
                        <span>{novel.progresso_total || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${grad} h-full rounded-full transition-all duration-700`}
                          style={{ width: `${novel.progresso_total || 0}%` }}
                        />
                      </div>
                      {novel.capitulos_estimados && novel.capitulos_estimados > 0 && (
                        <p className="text-[9px] text-slate-700 mt-1 text-right">
                          Meta: {novel.capitulos_estimados} capítulos
                        </p>
                      )}
                    </div>

                    {/* Data de criação */}
                    <div className="flex items-center gap-1 text-[9px] text-slate-700 mb-3">
                      <Calendar size={9} />
                      <span>Criado em {new Date(novel.data_criacao || Date.now()).toLocaleDateString("pt-BR")}</span>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-2">
                      <Link
                        href={`/obra/${novel.id}`}
                        className={`flex items-center justify-center gap-2 flex-1 bg-gradient-to-r ${grad} hover:opacity-90 active:scale-[0.98] py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg`}
                      >
                        <BookOpen size={14} /> Acessar
                      </Link>
                      <Link
                        href={`/escrita/${novel.id}`}
                        className="flex items-center justify-center gap-2 px-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] py-2.5 rounded-xl font-bold text-sm transition-all"
                      >
                        <Feather size={14} /> Escrever
                      </Link>
                    </div>

                    {/* Badge de obra ativa */}
                    {novel.status === "Ativa" && (
                      <div className="absolute bottom-3 left-3">
                        <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[8px] px-2 py-0.5 rounded-full">
                          <Zap size={8} />
                          <span>Em produção</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Dica de produtividade ── */}
        {novelsWithStats.length > 0 && (
          <div className="mt-12 p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-slate-800 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">💡 Dica de Produtividade</p>
                <p className="text-[11px] text-slate-500">
                  Você já escreveu {totalPalavras.toLocaleString("pt-BR")} palavras no total! 
                  {totalPalavras > 50000 
                    ? " Incrível! Isso é mais que um romance curto! 🎉" 
                    : totalPalavras > 10000 
                      ? " Continue assim, você está no caminho certo! 🚀"
                      : " Cada palavra conta, continue escrevendo! ✍️"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}