import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ScrollText, Plus, Pencil, X } from "lucide-react";
import EditorTiptap from "@/components/EditorTiptap";
import ClientWrapper from "@/components/ClientWrapper";
import TituloCapituloForm from "@/components/TituloCapituloForm";
import StatusCapituloSelect from "@/components/StatusCapituloSelect";
import EditorWrapper from "@/components/EditorWrapper";
import { SearchInput } from "@/components/SearchInput";
import { ReferenciasList } from "@/components/ReferenciasList";
import { createCapitulo, getCapitulos } from "@/lib/actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ capitulo?: string; busca?: string }>;
};

export default async function EscritaPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { capitulo: capParam, busca: buscaParam } = await searchParams;
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

  // Busca de personagens com filtro opcional
  const personagens = await prisma.personagens.findMany({
    where: { 
      novel_id: novelId,
      ...(buscaParam ? {
        OR: [
          { nome: { contains: buscaParam, mode: 'insensitive' } },
          { papel: { contains: buscaParam, mode: 'insensitive' } }
        ]
      } : {})
    },
    select: { id: true, nome: true, papel: true },
    orderBy: { nome: "asc" },
    take: buscaParam ? 50 : 20,
  });

  // Busca de grimório com filtro opcional
  const grimorioLocais = await prisma.grimorio.findMany({
    where: { 
      novel_id: novelId,
      ...(buscaParam ? {
        OR: [
          { titulo: { contains: buscaParam, mode: 'insensitive' } },
          { categoria: { contains: buscaParam, mode: 'insensitive' } }
        ]
      } : {})
    },
    select: { id: true, titulo: true, categoria: true },
    orderBy: { titulo: "asc" },
    take: buscaParam ? 50 : 20,
  });

  // Estatísticas avançadas dos capítulos
  const estatisticas = {
    totalPalavras: capitulos.reduce((a: number, c: any) => a + (c.palavras_contagem || 0), 0),
    mediaPalavras: capitulos.length > 0 
      ? Math.round(capitulos.reduce((a: number, c: any) => a + (c.palavras_contagem || 0), 0) / capitulos.length)
      : 0,
    maiorCapitulo: capitulos.reduce((max: any, c: any) => 
      (c.palavras_contagem || 0) > (max?.palavras_contagem || 0) ? c : max, null),
    rascunhos: capitulos.filter((c: any) => c.status === "Rascunho").length,
    publicados: capitulos.filter((c: any) => c.status === "Publicado").length,
  };

  // Serializar dados do Prisma
  const serializedPersonagens = JSON.parse(JSON.stringify(personagens));
  const serializedGrimorio = JSON.parse(JSON.stringify(grimorioLocais));
  const serializedNovel = JSON.parse(JSON.stringify({ id: novel.id, titulo: novel.titulo }));

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
                {estatisticas.totalPalavras.toLocaleString("pt-BR")} palavras totais · {capitulos.length} cap. · 
                Média {estatisticas.mediaPalavras.toLocaleString("pt-BR")} palavras/cap.
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
        {/* Sidebar esquerda - Capítulos com estatísticas */}
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

            {/* Mini estatísticas dos capítulos */}
            {capitulos.length > 0 && (
              <div className="mb-4 p-2 bg-slate-950/50 rounded-lg text-[10px]">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Rascunhos:</span>
                  <span className="text-yellow-400 font-bold">{estatisticas.rascunhos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Publicados:</span>
                  <span className="text-green-400 font-bold">{estatisticas.publicados}</span>
                </div>
                {estatisticas.maiorCapitulo && (
                  <div className="mt-1 pt-1 border-t border-slate-800">
                    <span className="text-slate-500">Maior cap:</span>
                    <span className="text-blue-400 ml-1">
                      {estatisticas.maiorCapitulo.palavras_contagem?.toLocaleString("pt-BR") || 0}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-0.5 max-h-[55vh] overflow-y-auto">
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
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate font-medium flex-1">{cap.titulo}</p>
                      {cap.status === "Publicado" && (
                        <span className="text-[8px] text-green-400 flex-shrink-0">✓</span>
                      )}
                    </div>
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
              {/* Título do capítulo - Client Component */}
              <TituloCapituloForm 
                capituloId={capituloSelecionado.id}
                tituloInicial={capituloSelecionado.titulo}
                novelId={novelId}
              />

              {/* Status do capítulo - Client Component */}
              <StatusCapituloSelect 
                capituloId={capituloSelecionado.id}
                statusInicial={capituloSelecionado.status || "Rascunho"}
              />

              {/* Informações adicionais */}
              {capituloSelecionado.palavras_contagem > 0 && (
                <div className="flex items-center gap-3 text-[10px] px-1">
                  <span className="text-slate-600">
                    ⏱️ Tempo estimado de leitura: {Math.ceil(capituloSelecionado.palavras_contagem / 200)} min
                  </span>
                </div>
              )}

              {/* Editor */}
<div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
  <EditorWrapper
    capituloId={capituloSelecionado.id}
    novelId={novelId}
    initialContent={capituloSelecionado.conteudo_json}
  />
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

        {/* Sidebar direita - Referências com busca e interatividade */}
        {(serializedPersonagens.length > 0 || serializedGrimorio.length > 0) && (
          <aside className="w-52 flex-shrink-0">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 sticky top-[65px] space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Referências
                </p>
                {(buscaParam || serializedPersonagens.length > 20 || serializedGrimorio.length > 20) && (
                  <Link
                    href={`/escrita/${novelId}?capitulo=${capituloSelecionado?.id || ''}`}
                    className="text-[9px] text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    <X size={10} />
                  </Link>
                )}
              </div>

              {/* Barra de busca - Client Component */}
              <SearchInput 
                novelId={novelId} 
                capituloId={capituloSelecionado?.id || null} 
                buscaParam={buscaParam} 
              />

              {/* Lista de referências - Client Component */}
              <ReferenciasList 
                personagens={serializedPersonagens}
                grimorio={serializedGrimorio}
                buscaParam={buscaParam}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}