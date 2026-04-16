import { prisma } from "../lib/prisma";
// O Prisma gera automaticamente o tipo 'novels' baseado na sua tabela
import { novels } from "@prisma/client";

export default async function Dashboard() {
  // Buscando todas as novels do seu banco local
  // Tipamos a variável 'allNovels' como um array de 'novels'
  const allNovels: novels[] = await prisma.novels.findMany();

  return (
    <main className="p-8 bg-slate-950 min-h-screen text-white font-sans">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-blue-500 tracking-tight">Re:Novel</h1>
          <p className="text-slate-500 text-sm">Bem-vindo ao seu QG de Autor</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg active:scale-95">
          + Nova Obra
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allNovels.map((novel: novels) => (
          <div 
            key={novel.id} 
            className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            {/* Indicador visual lateral */}
            <div className="absolute left-0 top-0 h-full w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-wider bg-blue-900/30 text-blue-400 px-2.5 py-1 rounded">
                {novel.genero || "Geral"}
              </span>
              <span className="text-[10px] font-medium text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">
                {novel.status}
              </span>
            </div>
            
            <h2 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
              {novel.titulo}
            </h2>
            
            <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">
              {novel.sinopse || "Explore novas fronteiras nesta história..."}
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-end text-xs mb-1">
                <span className="text-slate-500">Progresso de Escrita</span>
                <span className="font-mono text-blue-400">{novel.progresso_total}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${novel.progresso_total}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-6 flex items-center text-[11px] text-slate-600 gap-4">
               <span>📅 Criada em: {new Date(novel.data_criacao).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        ))}

        {/* Card Vazio para incentivar nova história */}
        {allNovels.length === 0 && (
          <div className="col-span-full text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500">Nenhuma obra encontrada. Comece sua jornada agora!</p>
          </div>
        )}
      </div>
    </main>
  );
}