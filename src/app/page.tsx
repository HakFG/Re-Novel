import { prisma } from "@/lib/prisma";
import { Plus, BookOpen, Trash2, Feather, TrendingUp, CheckCircle } from "lucide-react";
import Link from "next/link";
import { createNovel, deleteNovel } from "@/lib/actions";

export default async function Dashboard() {
  const allNovels = await prisma.novels.findMany({
    orderBy: { data_criacao: "desc" },
    include: {
      _count: { select: { personagens: true, capitulos: true, grimorio: true } },
    },
  });

  const generoGradient: Record<string, string> = {
    Fantasia: "from-violet-500 to-indigo-600",
    "Sci-Fi": "from-cyan-500 to-blue-600",
    Terror: "from-red-600 to-rose-800",
    Romance: "from-pink-500 to-rose-500",
  };

  const statusStyle: Record<string, { dot: string; label: string }> = {
    "Em Planejamento": { dot: "bg-amber-400", label: "text-amber-400" },
    Ativa: { dot: "bg-emerald-400", label: "text-emerald-400" },
    Hiato: { dot: "bg-orange-400", label: "text-orange-400" },
    Concluída: { dot: "bg-blue-400", label: "text-blue-400" },
  };

  const totalCaps = allNovels.reduce((a, n) => a + n._count.capitulos, 0);
  const ativas = allNovels.filter(
    (n) => n.status === "Ativa" || n.status === "Em Planejamento"
  ).length;
  const concluidas = allNovels.filter((n) => n.status === "Concluída").length;

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
              {allNovels.length} obra{allNovels.length !== 1 ? "s" : ""} no multiverso
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

        {/* ── Stats Bar ── */}
        {allNovels.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-12">
            {[
              { icon: BookOpen, value: totalCaps, label: "Capítulos Escritos", color: "text-blue-400", glow: "shadow-blue-900/30" },
              { icon: TrendingUp, value: ativas, label: "Em Andamento", color: "text-amber-400", glow: "shadow-amber-900/30" },
              { icon: CheckCircle, value: concluidas, label: "Concluídas", color: "text-emerald-400", glow: "shadow-emerald-900/30" },
            ].map(({ icon: Icon, value, label, color, glow }) => (
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
        )}

        {/* ── Novels Grid ── */}
        {allNovels.length === 0 ? (
          <div className="text-center py-36">
            <p className="text-6xl mb-5">📖</p>
            <h2 className="text-2xl font-bold text-slate-500 mb-2">Página em branco</h2>
            <p className="text-slate-600 text-sm">Crie sua primeira obra acima para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allNovels.map((novel) => {
              const grad = generoGradient[novel.genero || ""] || "from-blue-500 to-purple-600";
              const st = statusStyle[novel.status || ""] || statusStyle["Em Planejamento"];
              return (
                <div
                  key={novel.id}
                  className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-600/80 transition-all duration-300 backdrop-blur-sm flex flex-col overflow-hidden"
                >
                  {/* Top accent line */}
                  <div
                    className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${grad} opacity-50 group-hover:opacity-100 transition-opacity duration-300`}
                  />

                  {/* Delete */}
                  <form
                    action={async () => {
                      "use server";
                      await deleteNovel(novel.id);
                    }}
                    className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </form>

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
                      <div className="flex items-center gap-2 mt-1">
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

                  <p className="text-slate-500 text-sm line-clamp-2 mb-5 flex-1 leading-relaxed">
                    {novel.sinopse || "Nenhuma sinopse definida ainda."}
                  </p>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-1.5 mb-5">
                    {[
                      { v: novel._count.capitulos, l: "Cap." },
                      { v: novel._count.personagens, l: "Pers." },
                      { v: novel._count.grimorio, l: "Grim." },
                    ].map(({ v, l }) => (
                      <div key={l} className="bg-slate-950/60 rounded-lg py-2 text-center">
                        <p className="text-base font-black text-white leading-none">{v}</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">{l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="mb-5">
                    <div className="w-full bg-slate-800 h-0.5 rounded-full overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${grad} h-full rounded-full transition-all duration-700`}
                        style={{ width: `${novel.progresso_total || 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-700 mt-1 text-right">
                      {novel.progresso_total || 0}%
                    </p>
                  </div>

                  <Link
                    href={`/obra/${novel.id}`}
                    className={`flex items-center justify-center gap-2 w-full bg-gradient-to-r ${grad} hover:opacity-90 active:scale-[0.98] py-3 rounded-xl font-bold text-sm transition-all shadow-lg`}
                  >
                    <BookOpen size={15} /> Acessar Obra
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}