import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ScrollText, Save, Plus, Pencil } from "lucide-react";
import EditorTiptap from "@/components/EditorTiptap";
import ClientWrapper from "@/components/ClientWrapper";
import { createCapitulo, getCapitulos } from "@/lib/actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ capitulo?: string }>;
};

export default async function EscritaPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { capitulo: capParam } = await searchParams;
  const novelId = parseInt(id);
  const capituloId = capParam ? parseInt(capParam) : null;

  if (isNaN(novelId)) notFound();

  const novel = await prisma.novels.findUnique({ where: { id: novelId } });
  if (!novel) notFound();

  // Já vem serializado do actions.ts
  const capitulos = await getCapitulos(novelId);

  let capituloAtual = null;
  if (capituloId) {
    capituloAtual = await prisma.capitulos.findUnique({ where: { id: capituloId } });
    // Serializar manualmente
    if (capituloAtual) {
      capituloAtual = JSON.parse(JSON.stringify(capituloAtual));
    }
  }

  const capituloSelecionado = capituloAtual || capitulos[0] || null;

  const personagens = await prisma.personagens.findMany({
    where: { novel_id: novelId },
    select: { id: true, nome: true, papel: true },
    orderBy: { nome: "asc" },
  });

  const grimorioLocais = await prisma.grimorio.findMany({
    where: { novel_id: novelId },
    select: { id: true, titulo: true, categoria: true },
    orderBy: { titulo: "asc" },
    take: 20,
  });

  // Serializar dados do Prisma
  const serializedPersonagens = JSON.parse(JSON.stringify(personagens));
  const serializedGrimorio = JSON.parse(JSON.stringify(grimorioLocais));
  const serializedNovel = JSON.parse(JSON.stringify({ id: novel.id, titulo: novel.titulo }));

  const totalPalavras = capitulos.reduce((a: number, c: any) => a + (c.palavras_contagem || 0), 0);

  async function criarNovoCapitulo() {
    "use server";
    const novo = await createCapitulo(novelId, `Capítulo ${capitulos.length + 1}`);
    redirect(`/escrita/${novelId}?capitulo=${novo.id}`);
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-blue-600/5 blur-3xl rounded-full" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/70 bg-slate-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link
              href={`/obra/${novelId}`}
              className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-1.5 group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              Voltar
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div>
              <div className="flex items-center gap-2">
                <Pencil size={13} className="text-blue-400" />
                <h1 className="text-sm font-bold text-white">{serializedNovel.titulo}</h1>
              </div>
              <p className="text-[10px] text-slate-600 ml-5">
                {totalPalavras.toLocaleString("pt-BR")} palavras totais · {capitulos.length} cap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href={`/obra/${novelId}?tab=personagens`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Users size={13} /> Personagens
            </Link>
            <Link
              href={`/obra/${novelId}?tab=grimorio`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ScrollText size={13} /> Grimório
            </Link>
          </div>
        </div>
      </header>

      {/* Layout principal */}
      <div className="max-w-[1400px] mx-auto px-5 py-6 flex gap-5">
        {/* Sidebar esquerda - Capítulos */}
        <aside className="w-56 flex-shrink-0">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 sticky top-[65px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Capítulos</span>
              <form action={criarNovoCapitulo}>
                <button
                  type="submit"
                  className="w-6 h-6 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-all active:scale-95"
                >
                  <Plus size={13} />
                </button>
              </form>
            </div>

            <div className="space-y-0.5 max-h-[65vh] overflow-y-auto">
              {capitulos.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-8 px-2">
                  Nenhum capítulo ainda.
                </p>
              ) : (
                capitulos.map((cap: any) => (
                  <Link
                    key={cap.id}
                    href={`/escrita/${novelId}?capitulo=${cap.id}`}
                    className={`block px-3 py-2 rounded-xl text-xs transition-all ${
                      capituloSelecionado?.id === cap.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <p className="truncate font-medium">{cap.titulo}</p>
                    <p className={`text-[9px] mt-0.5 ${capituloSelecionado?.id === cap.id ? "text-blue-200" : "text-slate-600"}`}>
                      {(cap.palavras_contagem || 0).toLocaleString("pt-BR")} palavras
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Editor principal */}
        <main className="flex-1 min-w-0">
          {capituloSelecionado ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  defaultValue={capituloSelecionado.titulo}
                  className="bg-transparent text-2xl font-black border-b border-slate-800 focus:border-blue-500 outline-none px-1 py-1 flex-1 transition-all placeholder:text-slate-700"
                  placeholder="Título do capítulo..."
                />
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-shrink-0">
                  <Save size={11} />
                  <span>Salvamento automático</span>
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
                <ClientWrapper>
                  <EditorTiptap
                    capituloId={capituloSelecionado.id}
                    initialContent={capituloSelecionado.conteudo_json}
                  />
                </ClientWrapper>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="text-6xl mb-5">✍️</div>
              <h2 className="text-xl font-bold text-slate-400 mb-2">Comece a escrever</h2>
              <p className="text-slate-600 text-sm mb-6">Crie o primeiro capítulo para começar</p>
              <form action={criarNovoCapitulo}>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 active:scale-95 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2"
                >
                  <Plus size={16} /> Criar Primeiro Capítulo
                </button>
              </form>
            </div>
          )}
        </main>

        {/* Sidebar direita - Referências */}
        {(serializedPersonagens.length > 0 || serializedGrimorio.length > 0) && (
          <aside className="w-52 flex-shrink-0">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 sticky top-[65px] space-y-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-1">
                Referências
              </p>

              {serializedPersonagens.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 mb-1.5 px-1 flex items-center gap-1">
                    <Users size={10} /> Personagens
                  </p>
                  <div className="space-y-0.5">
                    {serializedPersonagens.slice(0, 10).map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all cursor-default"
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[9px] font-black flex-shrink-0">
                          {p.nome?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-300 truncate font-medium">{p.nome}</p>
                          {p.papel && (
                            <p className="text-[9px] text-slate-600 truncate">{p.papel}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serializedGrimorio.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 mb-1.5 px-1 flex items-center gap-1">
                    <ScrollText size={10} /> Grimório
                  </p>
                  <div className="space-y-0.5">
                    {serializedGrimorio.slice(0, 10).map((g: any) => (
                      <div
                        key={g.id}
                        className="px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all cursor-default"
                      >
                        <p className="text-[11px] text-slate-300 truncate font-medium">{g.titulo}</p>
                        {g.categoria && (
                          <p className="text-[9px] text-slate-600">{g.categoria}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}