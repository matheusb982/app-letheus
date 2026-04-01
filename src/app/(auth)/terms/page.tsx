export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Última atualização: 01 de abril de 2026
      </p>

      <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
          <p>
            Ao criar uma conta e utilizar o Letheus IA Financeira (&quot;Serviço&quot;), você concorda
            com estes Termos de Uso. Se não concordar, não utilize o Serviço.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
          <p>
            O Letheus é uma plataforma de gestão financeira pessoal que permite importar extratos
            bancários, categorizar despesas automaticamente com inteligência artificial, definir metas
            de gastos e consultar um assistente financeiro com IA.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Conta e Família</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Cada conta está vinculada a uma &quot;família&quot; (grupo de até 3 membros).</li>
            <li>O criador da conta é o &quot;owner&quot; (responsável) da família.</li>
            <li>O owner pode adicionar e remover membros da família.</li>
            <li>Todos os dados financeiros são compartilhados dentro da família.</li>
            <li>Os membros da família têm acesso compartilhado aos dados financeiros inseridos no grupo. Ao convidar membros, o owner declara possuir autorização para compartilhar tais informações.</li>
            <li>O owner é responsável por garantir que os membros concordem com estes termos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Período de Teste (Trial)</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Ao se cadastrar, você recebe 7 dias de teste gratuito com acesso completo.</li>
            <li>Após o período de teste, funcionalidades de edição serão bloqueadas (importação, criação de despesas/receitas, chat com IA, metas).</li>
            <li>Você continuará podendo visualizar seus dados e o dashboard.</li>
            <li>O uso após o período gratuito não gera cobrança automática. A contratação é opcional e depende de ação do usuário.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Uso de Inteligência Artificial</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>O Serviço utiliza modelos de IA de terceiros (OpenAI e Google) para classificação de despesas, sugestão de metas e chat financeiro.</li>
            <li>Dados financeiros (valores, descrições de transações, categorias) são enviados a estes provedores para processamento. <strong>Nenhum dado pessoal identificável</strong> (nome, email, senha) é compartilhado.</li>
            <li>As respostas da IA são sugestões e não constituem aconselhamento financeiro profissional.</li>
            <li>O Letheus não se responsabiliza por perdas financeiras, decisões de investimento ou quaisquer consequências decorrentes do uso das informações fornecidas pela IA ou pelo sistema.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Responsabilidades do Usuário</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Manter a confidencialidade da sua senha.</li>
            <li>Fornecer informações verdadeiras no cadastro.</li>
            <li>Não utilizar o Serviço para fins ilegais.</li>
            <li>Não tentar acessar dados de outras famílias.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Exclusão de Conta</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Membros podem excluir sua conta a qualquer momento. Seus dados pessoais serão removidos e referências anonimizadas.</li>
            <li>O owner pode excluir a família inteira, removendo todos os dados financeiros e contas de membros de forma irreversível.</li>
            <li>Consulte nossa Política de Privacidade para detalhes sobre retenção e exclusão de dados.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Limitações do Serviço</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>O Serviço é fornecido &quot;como está&quot;, sem garantias de disponibilidade ininterrupta.</li>
            <li>Respostas do chat são cacheadas por até 3 horas para otimização.</li>
            <li>A classificação automática por IA pode conter erros e deve ser revisada pelo usuário.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Propriedade Intelectual</h2>
          <p>
            O Serviço, incluindo código, design e funcionalidades, é propriedade do Letheus.
            Seus dados financeiros permanecem seus. Não reivindicamos propriedade sobre os dados que você insere.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Alterações nos Termos</h2>
          <p>
            Podemos atualizar estes termos periodicamente. Alterações significativas serão comunicadas
            via email ou notificação no Serviço. O uso continuado após alterações constitui aceitação.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Legislação Aplicável</h2>
          <p>
            Estes termos são regidos pelas leis da República Federativa do Brasil, em especial
            o Marco Civil da Internet (Lei 12.965/2014) e a Lei Geral de Proteção de Dados (Lei 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Contato</h2>
          <p>
            Para dúvidas sobre estes termos, entre em contato pelo email: <strong>contato@letheus.com.br</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
